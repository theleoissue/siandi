-- Sprin/2078 (Kegiatan Rutin yang Ditingkatkan, apel Minggu 6 September 2026)
-- dibuat lewat aplikasi pada 6 September, SEBELUM migrasi 20260908000001
-- membetulkan kode_klasifikasi KRYD ke PAM.1.3.2. -- nomor_lengkap-nya
-- kadung "membeku" dengan kode lama yang salah (OPS.1.3., bentrok dengan
-- OPERASI KEPOLISIAN KEWILAYAHAN). Tidak ada dokumen fisik/PDF untuk Sprin
-- ini (dibuat langsung lewat aplikasi, bukan hasil transkrip arsip) jadi
-- tidak ada nomor "asli" yang perlu dipertahankan -- aman diperbaiki
-- langsung ke nilai yang seharusnya.
update public.surat_perintah
set nomor_lengkap = 'SPRIN/2078/IX/PAM.1.3.2./2026'
where nomor_agenda = 2078
  and nomor_lengkap = 'SPRIN/2078/IX/OPS.1.3./2026';

select nomor_agenda, nomor_lengkap from public.surat_perintah where nomor_agenda = 2078;
