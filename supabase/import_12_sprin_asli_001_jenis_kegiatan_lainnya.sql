-- Prasyarat sebelum import_12_sprin.sql: tambah jenis_kegiatan baru untuk
-- 3 Sprin PAM insidentil (Carnaval Parongpong, Panggung Rakyat HUT RI/PAN,
-- Nobar Persib vs Bali United) yang tidak masuk 5 jenis baku yang sudah ada.
-- kategori dibiarkan NULL (kolom sudah opsional sejak
-- 20260826000017_kategori_opsional.sql) karena "kegiatan lainnya" ini tidak
-- pas dipaksakan ke salah satu dari KRYD/PAM_VIP/UNRAS/OPERASI.
-- wajib_isi_durasi_manual = true karena durasi tiap event beda-beda (bukan
-- pola tetap seperti KRYD), jadi tidak ada perkiraan_durasi_jam baku.

insert into public.jenis_kegiatan (nama, kode_klasifikasi, kategori, perkiraan_durasi_jam, wajib_isi_durasi_manual)
select 'PENGAMANAN KEGIATAN LAINNYA', 'PAM.3.3.', null, null, true
where not exists (
  select 1 from public.jenis_kegiatan where nama = 'PENGAMANAN KEGIATAN LAINNYA'
);

-- Dasar hukum baku yang dipakai bersama ketiga Sprin PAM.3.3. ini (4 item,
-- semuanya sudah ada di dasar_hukum_baku dari migrasi sebelumnya -- tidak
-- perlu insert dasar_hukum_baku baru, tinggal disambungkan lewat jenis_kegiatan_dasar_hukum).
insert into public.jenis_kegiatan_dasar_hukum (jenis_kegiatan_id, dasar_hukum_baku_id, urutan)
select jk.id, dhb.id, v.urutan
from (values
  ('PENGAMANAN KEGIATAN LAINNYA', 'Undang-Undang Nomor 5 Tahun 2026 tentang perubahan ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;', 0),
  ('PENGAMANAN KEGIATAN LAINNYA', 'Perkap Nomor 1 Tahun 2009 tentang Penggunaan Kekuatan dalam Tindakan Kepolisian;', 1),
  ('PENGAMANAN KEGIATAN LAINNYA', 'Peraturan Kepala Kepolisian Negara Republik Indonesia Nomor 8 Tahun 2021 tentang Perubahan atas Perkap Nomor 1 Tahun 2019 tentang Sistem, Manajemen dan Standar Keberhasilan Operasional Polri;', 2),
  ('PENGAMANAN KEGIATAN LAINNYA', 'Rengiat Polres Cimahi T.A. 2026.', 3)
) as v(nama_jenis, teks_dhb, urutan)
join public.jenis_kegiatan jk on jk.nama = v.nama_jenis
join public.dasar_hukum_baku dhb on dhb.teks = v.teks_dhb
on conflict (jenis_kegiatan_id, dasar_hukum_baku_id) do nothing;

-- Butir "Untuk" baku (ekor) -- disamakan dengan pola PAM VIP/VVIP karena
-- sama-sama pengamanan kegiatan insidentil, plus larangan bawa senjata api
-- + PDL II Two Tone yang memang tertulis eksplisit di ketiga Sprin sumber.
insert into public.jenis_kegiatan_untuk_baku (jenis_kegiatan_id, teks, urutan)
select jk.id, v.teks, v.urutan
from (values
  ('PENGAMANAN KEGIATAN LAINNYA', 'seluruh personel DILARANG MEMBAWA / MENGGUNAKAN SENJATA API dalam pelaksanaan tugas pengamanan;', 0),
  ('PENGAMANAN KEGIATAN LAINNYA', 'personel menggunakan pakaian PDL-II Two Tone / menyesuaikan;', 1),
  ('PENGAMANAN KEGIATAN LAINNYA', 'melaksanakan koordinasi dan kerjasama dengan pihak/instansi terkait;', 2),
  ('PENGAMANAN KEGIATAN LAINNYA', 'melaksanakan perintah ini dengan saksama dan penuh rasa tanggung jawab;', 3),
  ('PENGAMANAN KEGIATAN LAINNYA', 'melaporkan hasil pelaksanaan tugas kepada Ka / Waka / Kabag Ops Polres Cimahi pada kesempatan pertama.', 4)
) as v(nama_jenis, teks, urutan)
join public.jenis_kegiatan jk on jk.nama = v.nama_jenis
on conflict do nothing;

-- Verifikasi:
select jk.id, jk.nama, jk.kode_klasifikasi, jk.kategori,
  (select count(*) from public.jenis_kegiatan_dasar_hukum where jenis_kegiatan_id = jk.id) as jml_dasar_hukum,
  (select count(*) from public.jenis_kegiatan_untuk_baku where jenis_kegiatan_id = jk.id) as jml_untuk_baku
from public.jenis_kegiatan jk where jk.nama = 'PENGAMANAN KEGIATAN LAINNYA';
