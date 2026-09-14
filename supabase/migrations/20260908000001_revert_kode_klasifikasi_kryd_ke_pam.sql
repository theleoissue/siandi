-- Revisi lanjutan atas 20260908000000: kode klasifikasi KRYD yang saya
-- ganti ke "OPS.1.3.2." ternyata SALAH -- kode itu tidak ada baik di
-- standar resmi Kepolisian (Kep/313/V/2010 tentang Kode Klasifikasi Arsip
-- Polri) maupun di praktik nyata Polres Cimahi.
--
-- Bukti:
-- 1. Kep/313/V/2010 (Lampiran B) tidak punya kategori "KRYD" sama sekali.
--    "OPS.1.3." resminya berarti "Kewilayahan (operasi masing-masing
--    wilayah)" -- sudah benar dipakai OPERASI KEPOLISIAN KEWILAYAHAN.
--    "OPS.1.3.2." tidak ada di tabel resmi manapun.
-- 2. SEMUA dokumen Sprin KRYD asli Polres Cimahi (12+ dokumen, Juli-
--    September 2026) mencetak nomor "Sprin/xxxx/VIII/PAM.1.3.2./2026" di
--    halaman SURAT UTAMA-nya -- ini kode lokal Cimahi sendiri untuk KRYD,
--    bukan dari tabel nasional (KRYD memang tidak ada padanan resmi,
--    jadi Cimahi pakai kode sendiri secara konsisten).
-- 3. File referensi awal project (SIANDI_ekstraksi_v1.xlsx, sheet
--    04_JENIS_KEGIATAN, baris JK-01) juga mencatat kode KRYD = PAM.1.3.2.
--
-- Jadi kode yang benar untuk KRYD adalah PAM.1.3.2. -- mengembalikan ke
-- nilai sebelum migrasi 20260826000015 pernah mengubahnya ke OPS.1.3.
-- (yang ternyata itu juga sudah salah, bentrok dengan Operasi Kepolisian
-- Kewilayahan).
update public.jenis_kegiatan set kode_klasifikasi = 'PAM.1.3.2.'
where nama = 'KEGIATAN RUTIN YANG DITINGKATKAN';

-- Verifikasi tidak ada lagi kode_klasifikasi yang bentrok:
select kode_klasifikasi, count(*), array_agg(nama order by nama) as jenis_kegiatan
from public.jenis_kegiatan
group by kode_klasifikasi
having count(*) > 1;

-- Daftar lengkap semua jenis kegiatan + kode_klasifikasi setelah perbaikan:
select nama, kode_klasifikasi, kategori
from public.jenis_kegiatan
order by kode_klasifikasi;
