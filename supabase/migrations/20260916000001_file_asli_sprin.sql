-- Simpan tautan file PDF asli (hasil scan dokumen fisik) untuk Sprin yang
-- diimpor dari arsip historis. Tombol "Unduh Sprin Asli" di halaman detail
-- cuma muncul kalau kolom ini terisi -- Sprin yang dibuat langsung lewat
-- SIANDI (bukan hasil impor) tidak punya file asli, jadi kolomnya tetap null.
alter table public.surat_perintah add column if not exists file_asli_path text;

-- Bucket privat -- akses lewat signed URL yang dibuatkan backend/frontend
-- setelah RLS storage.objects di bawah ini lolos, bukan lewat URL publik.
insert into storage.buckets (id, name, public)
values ('sprin-asli', 'sprin-asli', false)
on conflict (id) do nothing;

-- Baca file asli: sama seperti siapa saja yang boleh baca baris Sprin-nya
-- sendiri (rls_01_select_surat_perintah) -- staf Bag Ops/Kapolres, penyusun,
-- atau personel yang ditugaskan di situ.
create policy sprin_asli_select on storage.objects
  for select
  using (
    bucket_id = 'sprin-asli'
    and exists (
      select 1 from public.surat_perintah sp
      where sp.file_asli_path = storage.objects.name
        and (
          sp.disusun_oleh = public.pengguna_id_saya()
          or public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN', 'KAPOLRES')
          or exists (
            select 1
            from public.sprin_kelompok sk
            join public.sprin_personel spr on spr.sprin_kelompok_id = sk.id
            where sk.surat_perintah_id = sp.id
              and spr.pengguna_id = public.pengguna_id_saya()
          )
        )
    )
  );

-- Unggah/kelola file asli: staf Bag Ops saja (yang juga pegang fitur impor &
-- hapus Sprin) -- bukan alur pemakaian rutin lewat UI, dipakai skrip impor
-- satu kali dan (kalau perlu) unggah manual susulan lewat Storage dashboard.
create policy sprin_asli_insert on storage.objects
  for insert
  with check (
    bucket_id = 'sprin-asli'
    and public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN')
  );

create policy sprin_asli_update on storage.objects
  for update
  using (bucket_id = 'sprin-asli' and public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN'))
  with check (bucket_id = 'sprin-asli' and public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN'));

create policy sprin_asli_delete on storage.objects
  for delete
  using (bucket_id = 'sprin-asli' and public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN'));
