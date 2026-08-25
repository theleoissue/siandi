-- RLS-01 adalah satu-satunya policy SELECT yang tidak menyebut STAF_ADMIN,
-- padahal SEMUA tabel turunannya (sprin_kelompok, sprin_personel,
-- sprin_dasar_hukum_baku, dasar_hukum_rujukan) sudah memasukkan STAF_ADMIN --
-- jadi ini kelalaian di spek awal, bukan pembatasan yang disengaja.
--
-- Akibat nyatanya: STAF_ADMIN boleh membuat Sprin (RLS-03) dan menu "Buat
-- Sprin" memang tampil untuknya, tapi dia cuma bisa membaca Sprin buatannya
-- sendiri. Pemeriksaan duplikat nomor agenda jadi buta terhadap Sprin milik
-- orang lain -- bisa menyatakan "belum dipakai" untuk nomor yang sebenarnya
-- sudah terpakai.
drop policy rls_01_select_surat_perintah on public.surat_perintah;
create policy rls_01_select_surat_perintah on public.surat_perintah
  for select
  using (
    disusun_oleh = public.pengguna_id_saya()
    or public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN', 'KAPOLRES')
  );
