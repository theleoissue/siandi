-- Mengosongkan seluruh data Sprin (10 baris saat ini: 9 historis + 1 uji coba)
-- sebelum diisi ulang dengan data asli. Jalankan lewat Supabase SQL Editor
-- (bukan lewat aplikasi -- surat_perintah tidak punya policy DELETE untuk
-- role manapun, jadi hapus lewat aplikasi/JS client tidak akan pernah ngefek).
--
-- TIDAK disentuh: roster personel (pengguna), jenis_kegiatan + preset-nya
-- (kelompok baku, dasar hukum baku, butir untuk baku) -- itu semua template
-- yang tetap dipakai untuk Sprin baru nanti, bukan data Sprin itu sendiri.

-- 1) Hapus tabel anak dulu secara eksplisit, urutan dari yang paling
--    "cucu" ke yang paling dekat surat_perintah -- ternyata FK di database
--    live TIDAK semuanya ON DELETE CASCADE seperti di file migrasi lokal
--    (log_aktivitas_surat_perintah_id_fkey terbukti RESTRICT), jadi hapus
--    manual supaya tidak kena "violates foreign key constraint".
delete from public.log_aktivitas;
delete from public.notifikasi;
delete from public.dasar_hukum_rujukan;
delete from public.sprin_personel;
delete from public.sprin_kelompok;
delete from public.personel_non_kuatpers;

-- 2) Baru sekarang surat_perintah aman dihapus, tidak ada lagi yang menunjuk ke dia.
delete from public.surat_perintah;

-- Verifikasi semuanya kosong:
select
  (select count(*) from public.surat_perintah) as sisa_surat_perintah,
  (select count(*) from public.sprin_kelompok) as sisa_sprin_kelompok,
  (select count(*) from public.sprin_personel) as sisa_sprin_personel,
  (select count(*) from public.log_aktivitas) as sisa_log_aktivitas,
  (select count(*) from public.notifikasi) as sisa_notifikasi,
  (select count(*) from public.personel_non_kuatpers) as sisa_personel_non_kuatpers;
