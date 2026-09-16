-- Migrasi sebelumnya sempat diganti sementara (lewat query diagnosa manual di
-- SQL Editor, bukan file migrasi) jadi "siapa saja yang login boleh upload"
-- untuk mengisolasi bug (ternyata bukan RLS yang salah, tapi opsi upsert:true
-- di skrip yang bentrok dengan RLS custom storage -- lihat scripts/unggah-sprin-asli.mjs).
-- Kembalikan ke aturan yang benar: cuma staf Bag Ops/Admin yang boleh upload.
drop policy if exists sprin_asli_insert on storage.objects;
create policy sprin_asli_insert on storage.objects
  for insert
  with check (
    bucket_id = 'sprin-asli'
    and public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN')
  );
