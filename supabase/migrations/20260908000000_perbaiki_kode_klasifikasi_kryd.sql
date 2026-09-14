-- Perbaikan bentrok kode_klasifikasi: KEGIATAN RUTIN YANG DITINGKATKAN dan
-- OPERASI KEPOLISIAN KEWILAYAHAN sama-sama tercatat "OPS.1.3." sejak migrasi
-- 20260826000015 (yang memindahkan KRYD dari rumpun PAM.1 ke rumpun OPS.1,
-- tapi kelewatan menghapus akhiran ".2." yang harusnya membedakan keduanya).
--
-- Bukti dari dokumen asli: dalam SPRIN/1819/VIII (KRYD 12 Agustus 2026),
-- halaman lampiran personel mencetak "NOMOR : SPRIN/1819/VIII/OPS.1.3.2./2026"
-- -- organisasi sendiri sudah pernah memakai "OPS.1.3.2." untuk KRYD, bukan
-- "OPS.1.3." polos. nomor_lengkap dokumen historis TIDAK disentuh (tetap
-- seperti tercetak asli di masing-masing dokumen) -- yang diperbaiki cuma
-- kode_klasifikasi jenis_kegiatan, dipakai untuk membentuk nomor_lengkap
-- Sprin BARU ke depan.
update public.jenis_kegiatan set kode_klasifikasi = 'OPS.1.3.2.'
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
