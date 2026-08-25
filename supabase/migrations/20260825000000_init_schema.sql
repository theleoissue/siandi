-- SIANDI — skema awal
-- Sumber: PRD_SIANDI_v1.docx Bagian 2 (skema), Bagian 3 (RLS), Bagian 4 (aturan bisnis)
-- Cakupan migration ini: 12 tabel inti + RLS-01..10.
-- Beberapa aturan bisnis (BR-02, BR-11, BR-14, BR-16, BR-17) diimplementasi sebagai
-- trigger karena menempel langsung ke bentuk skema/RLS-06; sisanya (BR-03,05,06,07,
-- 08,09,10,12,13,15) sengaja ditunda ke tahap "implementasi business rules" berikutnya.

-- ============================================================
-- 1. ENUM
-- ============================================================

create type kategori_kegiatan as enum ('KRYD', 'PAM_VIP', 'UNRAS', 'OPERASI');
create type sifat_kelompok as enum ('PENGENDALI', 'PELAKSANA');
create type jenis_dasar_hukum as enum ('UU', 'PERKAP', 'PERPOL', 'PERATURAN_LAIN');
create type peran_sistem as enum ('KAPOLRES', 'KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN', 'PERSONEL');
create type sumber_data_pengguna as enum ('KUATPERS', 'MANUAL');
create type keterangan_non_kuatpers as enum ('BKO', 'MUTASI', 'PENSIUN', 'LAINNYA');
create type status_surat_perintah as enum ('DRAF', 'MENUNGGU_PERSETUJUAN', 'DIKEMBALIKAN', 'DISETUJUI', 'TERBIT');

-- ============================================================
-- 2. TABEL (PRD Bagian 2.1 - 2.12)
-- ============================================================

-- 2.1 jenis_kegiatan
create table public.jenis_kegiatan (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  kode_klasifikasi text not null,
  kategori kategori_kegiatan not null,
  perkiraan_durasi_jam int,
  wajib_isi_durasi_manual boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.2 jenis_kegiatan_kelompok
create table public.jenis_kegiatan_kelompok (
  id uuid primary key default gen_random_uuid(),
  jenis_kegiatan_id uuid not null references public.jenis_kegiatan(id) on delete cascade,
  nama_kelompok text not null,
  sifat sifat_kelompok not null,
  kunci_penuh_durasi boolean not null default false,
  urutan_tampil int not null default 0
);

-- 2.3 dasar_hukum_baku
create table public.dasar_hukum_baku (
  id uuid primary key default gen_random_uuid(),
  teks text not null,
  jenis jenis_dasar_hukum not null
);

-- 2.5 pengguna (dibuat sebelum surat_perintah karena banyak FK ke sini)
-- id = auth.users.id, sesuai pola Supabase standar, supaya auth.uid() bisa dibandingkan langsung
create table public.pengguna (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  nrp text unique,
  pangkat text,
  jabatan_struktur text,
  satuan_fungsi text,
  peran_sistem peran_sistem not null,
  sumber_data sumber_data_pengguna not null default 'KUATPERS',
  status_aktif boolean not null default true,
  kuatpers_bulan_referensi text
);

-- 2.6 personel_non_kuatpers
create table public.personel_non_kuatpers (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  nrp text,
  pangkat text,
  jabatan_asal text,
  keterangan keterangan_non_kuatpers not null,
  catatan text,
  diinput_oleh uuid not null references public.pengguna(id),
  created_at timestamptz not null default now()
);

-- 2.7 surat_perintah
create table public.surat_perintah (
  id uuid primary key default gen_random_uuid(),
  nomor_agenda int,
  nomor_lengkap text,
  jenis_kegiatan_id uuid not null references public.jenis_kegiatan(id),
  perihal text,
  pertimbangan text,
  lokasi text,
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  jam_apel time,
  pemimpin_apel_id uuid references public.pengguna(id),
  status status_surat_perintah not null default 'DRAF',
  catatan_pemeriksaan text,
  disusun_oleh uuid not null references public.pengguna(id),
  disetujui_oleh uuid references public.pengguna(id),
  disetujui_pada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.4 dasar_hukum_rujukan (butuh surat_perintah, ditaruh setelahnya)
create table public.dasar_hukum_rujukan (
  id uuid primary key default gen_random_uuid(),
  surat_perintah_id uuid not null references public.surat_perintah(id) on delete cascade,
  jenis_dokumen text not null,
  nomor text,
  tanggal date,
  perihal text,
  urutan int not null default 0
);

-- 2.8 sprin_kelompok
create table public.sprin_kelompok (
  id uuid primary key default gen_random_uuid(),
  surat_perintah_id uuid not null references public.surat_perintah(id) on delete cascade,
  jenis_kegiatan_kelompok_id uuid references public.jenis_kegiatan_kelompok(id),
  nama_kelompok text not null,
  sifat sifat_kelompok not null,
  urutan int not null default 0
);

-- 2.9 sprin_personel
create table public.sprin_personel (
  id uuid primary key default gen_random_uuid(),
  sprin_kelompok_id uuid not null references public.sprin_kelompok(id) on delete cascade,
  pengguna_id uuid references public.pengguna(id),
  personel_non_kuatpers_id uuid references public.personel_non_kuatpers(id),
  nomor_urut_keseluruhan int not null,
  nomor_urut_kelompok int not null,
  jabatan_operasional text,
  constraint sprin_personel_exclusive_source check (
    (pengguna_id is not null) <> (personel_non_kuatpers_id is not null)
  )
);

create unique index sprin_personel_unik_pengguna_per_kelompok
  on public.sprin_personel (sprin_kelompok_id, pengguna_id)
  where pengguna_id is not null;

-- 2.10 sprin_dasar_hukum_baku
create table public.sprin_dasar_hukum_baku (
  surat_perintah_id uuid not null references public.surat_perintah(id) on delete cascade,
  dasar_hukum_baku_id uuid not null references public.dasar_hukum_baku(id),
  urutan int not null default 0,
  primary key (surat_perintah_id, dasar_hukum_baku_id)
);

-- 2.11 notifikasi
create table public.notifikasi (
  id uuid primary key default gen_random_uuid(),
  pengguna_id uuid not null references public.pengguna(id),
  surat_perintah_id uuid not null references public.surat_perintah(id) on delete cascade,
  dibaca boolean not null default false,
  dikirim_pada timestamptz not null default now()
);

-- 2.12 log_aktivitas
create table public.log_aktivitas (
  id uuid primary key default gen_random_uuid(),
  pengguna_id uuid references public.pengguna(id),
  surat_perintah_id uuid references public.surat_perintah(id),
  aksi text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. INDEX PENDUKUNG
-- ============================================================

create index idx_surat_perintah_status on public.surat_perintah (status);
create index idx_surat_perintah_disusun_oleh on public.surat_perintah (disusun_oleh);
create index idx_sprin_personel_pengguna on public.sprin_personel (pengguna_id);
create index idx_sprin_kelompok_surat_perintah on public.sprin_kelompok (surat_perintah_id);
create index idx_notifikasi_pengguna on public.notifikasi (pengguna_id);
create index idx_log_aktivitas_surat_perintah on public.log_aktivitas (surat_perintah_id);

-- ============================================================
-- 4. FUNGSI BANTU
-- ============================================================

-- Baca peran_sistem user yang sedang login. SECURITY DEFINER supaya tidak
-- terjebak rekursi RLS saat dipakai di dalam policy tabel pengguna sendiri.
create or replace function public.peran_saya()
returns peran_sistem
language sql
stable
security definer
set search_path = public
as $$
  select peran_sistem from public.pengguna where id = auth.uid()
$$;

create or replace function public.bulan_romawi(bulan int)
returns text
language sql
immutable
as $$
  select (array['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'])[bulan]
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_jenis_kegiatan_updated_at
  before update on public.jenis_kegiatan
  for each row execute function public.set_updated_at();

-- BR-02 + BR-11 + BR-16 (auto DISETUJUI->TERBIT, sekaligus penegak RLS-06) + BR-17
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
      new.disetujui_oleh := auth.uid();
    end if;
    if new.disetujui_pada is null then
      new.disetujui_pada := now();
    end if;
    new.status := 'TERBIT'; -- BR-16: langsung terbit otomatis, tidak ada state DISETUJUI yang tersimpan
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

create trigger trg_surat_perintah_before_write
  before insert or update on public.surat_perintah
  for each row execute function public.trg_surat_perintah_before_write();

-- BR-14: notifikasi ke seluruh personel berakun begitu status TERBIT
create or replace function public.trg_surat_perintah_after_terbit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'TERBIT' and (TG_OP = 'INSERT' or old.status is distinct from 'TERBIT') then
    insert into public.notifikasi (pengguna_id, surat_perintah_id, dibaca, dikirim_pada)
    select distinct sp.pengguna_id, new.id, false, now()
    from public.sprin_personel sp
    join public.sprin_kelompok sk on sk.id = sp.sprin_kelompok_id
    where sk.surat_perintah_id = new.id
      and sp.pengguna_id is not null;

    insert into public.log_aktivitas (pengguna_id, surat_perintah_id, aksi, detail)
    values (new.disetujui_oleh, new.id, 'TERBIT_OTOMATIS', null);
  end if;
  return new;
end;
$$;

create trigger trg_surat_perintah_after_terbit
  after insert or update on public.surat_perintah
  for each row execute function public.trg_surat_perintah_after_terbit();

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

alter table public.jenis_kegiatan enable row level security;
alter table public.jenis_kegiatan_kelompok enable row level security;
alter table public.dasar_hukum_baku enable row level security;
alter table public.dasar_hukum_rujukan enable row level security;
alter table public.pengguna enable row level security;
alter table public.personel_non_kuatpers enable row level security;
alter table public.surat_perintah enable row level security;
alter table public.sprin_kelompok enable row level security;
alter table public.sprin_personel enable row level security;
alter table public.sprin_dasar_hukum_baku enable row level security;
alter table public.notifikasi enable row level security;
alter table public.log_aktivitas enable row level security;

-- --- pengguna ---
-- (dasar, di luar penomoran RLS-xx: tabel butuh policy SELECT minimal supaya bisa dipakai)
create policy pengguna_select_diri_sendiri_atau_staf on public.pengguna
  for select
  using (
    id = auth.uid()
    or public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN', 'KAPOLRES')
  );

-- --- RLS-01: SELECT surat_perintah ---
create policy rls_01_select_surat_perintah on public.surat_perintah
  for select
  using (
    disusun_oleh = auth.uid()
    or public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'KAPOLRES')
  );

-- --- RLS-02: SELECT sprin_personel milik sendiri untuk PERSONEL ---
create policy rls_02_select_sprin_personel on public.sprin_personel
  for select
  using (
    public.peran_saya() <> 'PERSONEL'
    or pengguna_id = auth.uid()
  );

-- --- RLS-03: INSERT surat_perintah oleh editor ---
create policy rls_03_insert_surat_perintah on public.surat_perintah
  for insert
  with check (
    public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN')
    and disusun_oleh = auth.uid()
  );

-- --- RLS-03 + RLS-04: UPDATE surat_perintah oleh penyusun sendiri (edit draf, ajukan) ---
create policy rls_03_04_update_surat_perintah_penyusun on public.surat_perintah
  for update
  using (
    public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN')
    and disusun_oleh = auth.uid()
    and status in ('DRAF', 'DIKEMBALIKAN')
  )
  with check (
    public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN')
    and disusun_oleh = auth.uid()
    and status in ('DRAF', 'MENUNGGU_PERSETUJUAN')
  );

-- --- RLS-05 (+ RLS-06 lewat trigger): keputusan Kabag Ops ---
create policy rls_05_update_surat_perintah_kabagops on public.surat_perintah
  for update
  using (
    public.peran_saya() = 'KABAG_OPS'
    and status = 'MENUNGGU_PERSETUJUAN'
  )
  with check (
    public.peran_saya() = 'KABAG_OPS'
    and status in ('DISETUJUI', 'DIKEMBALIKAN', 'TERBIT')
  );

-- Catatan RLS-08: KAPOLRES/WAKA read-only pada surat_perintah — tercapai dengan
-- sendirinya karena tidak ada policy INSERT/UPDATE/DELETE yang menyebut peran ini.

-- --- RLS-07: INSERT personel_non_kuatpers ---
create policy rls_07_insert_personel_non_kuatpers on public.personel_non_kuatpers
  for insert
  with check (public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN'));

create policy personel_non_kuatpers_select_staf on public.personel_non_kuatpers
  for select
  using (public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN', 'KAPOLRES'));

-- --- RLS-09: log_aktivitas INSERT-only, tidak ada UPDATE/DELETE policy sama sekali ---
create policy rls_09_insert_log_aktivitas on public.log_aktivitas
  for insert
  with check (pengguna_id = auth.uid());

create policy rls_09_select_log_aktivitas on public.log_aktivitas
  for select
  using (public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN', 'KAPOLRES'));

-- --- RLS-10: data induk hanya diubah STAF_ADMIN, tapi boleh dibaca semua yang login ---
create policy rls_10_select_jenis_kegiatan on public.jenis_kegiatan
  for select using (true);
create policy rls_10_modify_jenis_kegiatan on public.jenis_kegiatan
  for all
  using (public.peran_saya() = 'STAF_ADMIN')
  with check (public.peran_saya() = 'STAF_ADMIN');

create policy rls_10_select_jenis_kegiatan_kelompok on public.jenis_kegiatan_kelompok
  for select using (true);
create policy rls_10_modify_jenis_kegiatan_kelompok on public.jenis_kegiatan_kelompok
  for all
  using (public.peran_saya() = 'STAF_ADMIN')
  with check (public.peran_saya() = 'STAF_ADMIN');

create policy rls_10_select_dasar_hukum_baku on public.dasar_hukum_baku
  for select using (true);
create policy rls_10_modify_dasar_hukum_baku on public.dasar_hukum_baku
  for all
  using (public.peran_saya() = 'STAF_ADMIN')
  with check (public.peran_saya() = 'STAF_ADMIN');

-- --- tabel turunan surat_perintah: baca luas untuk staf + penyusun, tulis oleh editor ---
create policy turunan_select_dasar_hukum_rujukan on public.dasar_hukum_rujukan
  for select
  using (public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN', 'KAPOLRES'));
create policy turunan_write_dasar_hukum_rujukan on public.dasar_hukum_rujukan
  for all
  using (public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN'))
  with check (public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN'));

create policy turunan_select_sprin_kelompok on public.sprin_kelompok
  for select
  using (public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN', 'KAPOLRES'));
create policy turunan_write_sprin_kelompok on public.sprin_kelompok
  for all
  using (public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN'))
  with check (public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN'));

create policy turunan_write_sprin_personel on public.sprin_personel
  for insert
  with check (public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN'));
create policy turunan_update_sprin_personel on public.sprin_personel
  for update
  using (public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN'))
  with check (public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN'));
create policy turunan_delete_sprin_personel on public.sprin_personel
  for delete
  using (public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN'));

create policy turunan_select_sprin_dasar_hukum_baku on public.sprin_dasar_hukum_baku
  for select
  using (public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN', 'KAPOLRES'));
create policy turunan_write_sprin_dasar_hukum_baku on public.sprin_dasar_hukum_baku
  for all
  using (public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN'))
  with check (public.peran_saya() in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN'));

-- --- notifikasi: setiap orang hanya baca & tandai baca miliknya sendiri ---
create policy notifikasi_select_sendiri on public.notifikasi
  for select using (pengguna_id = auth.uid());
create policy notifikasi_update_sendiri on public.notifikasi
  for update
  using (pengguna_id = auth.uid())
  with check (pengguna_id = auth.uid());
