-- Perbaikan desain: pengguna.id awalnya = auth.users.id (asumsi semua personel login).
-- Keputusan pemilik proyek (2026-08-25): hanya staf Bag Ops yang punya akun login di v1
-- (Kapolres, Kabag Ops, Kasubbag Binops, Paurmin) -- 1.176 personel KUATPERS lain tetap
-- ada di tabel `pengguna` sebagai roster (untuk dicari & ditempatkan di Sprin) TANPA akun.
-- Maka pengguna.id dilepas dari auth.users.id, diganti kolom auth_user_id nullable.

-- 1) Lepas FK pengguna.id -> auth.users, jadikan uuid mandiri.
alter table public.pengguna drop constraint pengguna_id_fkey;
alter table public.pengguna alter column id set default gen_random_uuid();

-- 2) Tambah kolom penaut akun login, opsional.
alter table public.pengguna add column auth_user_id uuid unique references auth.users(id) on delete set null;

-- 3) Perbarui fungsi peran_saya(): sebelumnya cari lewat pengguna.id = auth.uid(),
-- sekarang lewat pengguna.auth_user_id = auth.uid().
create or replace function public.peran_saya()
returns peran_sistem
language sql
stable
security definer
set search_path = public
as $$
  select peran_sistem from public.pengguna where auth_user_id = auth.uid()
$$;

-- Helper baru: pengguna.id milik user yang sedang login (dipakai menggantikan
-- perbandingan langsung "kolom = auth.uid()" di semua RLS/trigger surat_perintah).
create or replace function public.pengguna_id_saya()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.pengguna where auth_user_id = auth.uid()
$$;

-- 4) Perbaiki policy pengguna sendiri: dulu "id = auth.uid()", sekarang "auth_user_id = auth.uid()".
drop policy pengguna_select_diri_sendiri_atau_staf on public.pengguna;
create policy pengguna_select_diri_sendiri_atau_staf on public.pengguna
  for select
  using (
    auth_user_id = auth.uid()
    or public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN', 'KAPOLRES')
  );

-- 5) Perbaiki seluruh RLS surat_perintah yang membandingkan disusun_oleh/pengguna_id
-- langsung dengan auth.uid() -- sekarang disusun_oleh dkk. menyimpan pengguna.id,
-- bukan auth.uid(), jadi harus lewat pengguna_id_saya().
drop policy rls_01_select_surat_perintah on public.surat_perintah;
create policy rls_01_select_surat_perintah on public.surat_perintah
  for select
  using (
    disusun_oleh = public.pengguna_id_saya()
    or public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'KAPOLRES')
  );

drop policy rls_02_select_sprin_personel on public.sprin_personel;
create policy rls_02_select_sprin_personel on public.sprin_personel
  for select
  using (
    public.peran_saya() <> 'PERSONEL'
    or pengguna_id = public.pengguna_id_saya()
  );

drop policy rls_03_insert_surat_perintah on public.surat_perintah;
create policy rls_03_insert_surat_perintah on public.surat_perintah
  for insert
  with check (
    public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN')
    and disusun_oleh = public.pengguna_id_saya()
  );

drop policy rls_03_04_update_surat_perintah_penyusun on public.surat_perintah;
create policy rls_03_04_update_surat_perintah_penyusun on public.surat_perintah
  for update
  using (
    public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN')
    and disusun_oleh = public.pengguna_id_saya()
    and status in ('DRAF', 'DIKEMBALIKAN')
  )
  with check (
    public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN')
    and disusun_oleh = public.pengguna_id_saya()
    and status in ('DRAF', 'MENUNGGU_PERSETUJUAN')
  );

-- 6) Trigger surat_perintah: dulu "new.disetujui_oleh := auth.uid()" (salah tipe --
-- disetujui_oleh adalah FK ke pengguna, bukan auth.users). Perbaiki jadi pengguna_id_saya().
create or replace function public.trg_surat_perintah_before_write()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'DIKEMBALIKAN' and coalesce(new.catatan_pemeriksaan, '') = '' then
    raise exception 'catatan_pemeriksaan wajib diisi saat mengembalikan draf (BR-11)';
  end if;

  if new.status = 'MENUNGGU_PERSETUJUAN' and new.nomor_agenda is null then
    raise exception 'nomor_agenda wajib diisi sebelum diajukan (BR-17)';
  end if;

  if new.status = 'TERBIT' and (TG_OP = 'INSERT' or old.status is distinct from 'DISETUJUI') then
    raise exception 'status TERBIT hanya bisa dicapai otomatis dari DISETUJUI (RLS-06)';
  end if;

  if new.status = 'DISETUJUI' then
    if new.disetujui_oleh is null then
      new.disetujui_oleh := public.pengguna_id_saya();
    end if;
    if new.disetujui_pada is null then
      new.disetujui_pada := now();
    end if;
    new.status := 'TERBIT';
  end if;

  if new.nomor_agenda is not null then
    new.nomor_lengkap := 'SPRIN/' || new.nomor_agenda || '/' ||
      public.bulan_romawi(extract(month from new.tanggal_mulai)::int) || '/' ||
      (select kode_klasifikasi from public.jenis_kegiatan where id = new.jenis_kegiatan_id) ||
      '/' || extract(year from new.tanggal_mulai)::text;
  end if;

  if TG_OP = 'UPDATE' then
    new.updated_at := now();
  end if;

  return new;
end;
$$;

-- 7) log_aktivitas dan notifikasi punya bug yang sama: pengguna_id di kedua tabel itu
-- FK ke pengguna.id, bukan auth.users.id -- policy lama salah bandingkan ke auth.uid().
drop policy rls_09_insert_log_aktivitas on public.log_aktivitas;
create policy rls_09_insert_log_aktivitas on public.log_aktivitas
  for insert
  with check (pengguna_id = public.pengguna_id_saya());

drop policy notifikasi_select_sendiri on public.notifikasi;
create policy notifikasi_select_sendiri on public.notifikasi
  for select using (pengguna_id = public.pengguna_id_saya());

drop policy notifikasi_update_sendiri on public.notifikasi;
create policy notifikasi_update_sendiri on public.notifikasi
  for update
  using (pengguna_id = public.pengguna_id_saya())
  with check (pengguna_id = public.pengguna_id_saya());
