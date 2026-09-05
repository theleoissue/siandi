-- Perbaikan atas data 12 Sprin yang SUDAH berhasil masuk (import_12_sprin_asli_002_data.sql
-- sudah jalan sukses sekali) -- 2 hal yang belum sempat ikut versi yang sudah diperbaiki:
-- 1) lokasi masih NULL untuk 3 Sprin PAM.3.3. (Carnaval, Panggung Rakyat, Nobar)
-- 2) kelompok "PIMPINAN" di Sprin 1833 & 1845 masih tercatat PELAKSANA, seharusnya PENGENDALI
--    (isinya KAPOLRES + KABAG OPS + jajaran pimpinan, sama seperti UNSUR PIMPINAN/PIM STAF).
-- Aman dijalankan berkali-kali (idempotent, cuma UPDATE nilai final).

update public.surat_perintah set lokasi = 'Kantor Kecamatan Parongpong'
where nomor_agenda = 1833;

update public.surat_perintah set lokasi = 'Lapang Sepakbola Ds. Cisomang Kec. Cikalong Wetan'
where nomor_agenda = 1845;

update public.surat_perintah set lokasi = 'Mako Polres Cimahi (PIM Staf/Pers Pam Polres) dan Mako Polsek masing-masing (Personel Polsek jajaran)'
where nomor_agenda = 1848;

update public.sprin_kelompok sk
set sifat = 'PENGENDALI'
from public.surat_perintah sp
where sk.surat_perintah_id = sp.id
  and sp.nomor_agenda in (1833, 1845)
  and sk.nama_kelompok = 'PIMPINAN';

-- Verifikasi:
select nomor_agenda, lokasi from public.surat_perintah where nomor_agenda in (1833,1845,1848);

select sp.nomor_agenda, sk.nama_kelompok, sk.sifat
from public.sprin_kelompok sk
join public.surat_perintah sp on sp.id = sk.surat_perintah_id
where sp.nomor_agenda in (1833,1845) and sk.nama_kelompok = 'PIMPINAN';
