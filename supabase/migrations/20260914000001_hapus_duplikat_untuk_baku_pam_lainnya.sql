-- Bug ditemukan lewat print-out Sprin BCA Expo (2103) yang user kirim: butir "Untuk"
-- nomor 3-12 tercetak DOBEL PERSIS. Penyebabnya bukan dari impor Sprin manapun --
-- tabel jenis_kegiatan_untuk_baku utk "PENGAMANAN KEGIATAN LAINNYA" ternyata sudah
-- lama punya 10 baris padahal seharusnya cuma 5 (tiap urutan 0-4 muncul 2x, kemungkinan
-- migrasi awal jenis kegiatan ini kejalan dua kali). Setiap Sprin dengan jenis kegiatan
-- ini yang butir_untuk-nya tidak diisi manual (direkonstruksi otomatis dari baku, lihat
-- bangunButirUntuk di jenisKegiatanPreset.js) ikut kena dobel -- termasuk beberapa dari
-- batch impor historis (mis. Sispam 2086, BCA Expo 2103, Penyaluran Bahan Pangan 2100).
-- Cek jenis kegiatan lain (KRYD, Unjuk Rasa, VIP, Operasi Hari Besar/Kewilayahan) --
-- semuanya aman, cuma "PENGAMANAN KEGIATAN LAINNYA" yang kena.
delete from public.jenis_kegiatan_untuk_baku
where id in (
  'd56e4789-4625-4397-ba1d-e1cc59e364e0',
  '5b2a60ee-60bc-4238-9730-5b9b242e3411',
  'e6500ef1-4933-40cd-9bd3-a08391a9e862',
  'd0ee6be4-8089-4719-b0a1-fac78302fd34',
  'ef86b9a2-dfaf-4407-a0bf-f9a633ef6218'
);

-- Verifikasi: harus tinggal 5 baris, masing-masing urutan 0-4 sekali.
select urutan, teks
from public.jenis_kegiatan_untuk_baku
where jenis_kegiatan_id = '8c5a01ad-4bef-4b22-b745-f6770b07dfa9'
order by urutan;
