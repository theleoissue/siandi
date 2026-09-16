-- Jenis kegiatan baru: OPERASI KONTINJENSI (kode resmi OPS.2. per Lampiran B
-- KEP/313/V/2010 -- "OPS.2 Kontinjensi" = bencana alam/kebakaran/latihan
-- penanggulangan bencana). Ditemukan dari SPRIN/2130/IX/OPS.2./2026 (Latihan
-- Olah Strategi Aman Nusa II Penanganan Bencana) -- tidak cocok ke salah satu
-- dari 6 jenis yang sudah ada, dan berbeda sifat dari "PENGAMANAN KEGIATAN
-- LAINNYA" (itu untuk pengamanan event, ini untuk latihan/operasi internal).
insert into public.jenis_kegiatan (nama, kode_klasifikasi, kategori, perkiraan_durasi_jam, wajib_isi_durasi_manual)
select 'OPERASI KONTINJENSI', 'OPS.2.', 'OPERASI', null, true
where not exists (
  select 1 from public.jenis_kegiatan where nama = 'OPERASI KONTINJENSI'
);

-- Dasar hukum baru yang spesifik untuk kontinjensi/bencana (belum ada di
-- dasar_hukum_baku sebelumnya).
insert into public.dasar_hukum_baku (teks, jenis)
select 'Peraturan Kepala Kepolisian Negara Republik Indonesia Nomor 17 Tahun 2009 tentang Manajemen Penanggulangan Bencana tanggal 22 Desember 2009;', 'PERKAP'
where not exists (
  select 1 from public.dasar_hukum_baku where teks = 'Peraturan Kepala Kepolisian Negara Republik Indonesia Nomor 17 Tahun 2009 tentang Manajemen Penanggulangan Bencana tanggal 22 Desember 2009;'
);

-- Sambungkan dasar hukum baku (3 yang sudah ada + 1 yang baru) ke jenis
-- kegiatan baru, sesuai urutan yang tercetak di SPRIN/2130.
insert into public.jenis_kegiatan_dasar_hukum (jenis_kegiatan_id, dasar_hukum_baku_id, urutan)
select jk.id, dhb.id, v.urutan
from (values
  ('OPERASI KONTINJENSI', 'Undang-Undang Nomor 5 Tahun 2026 tentang perubahan ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;', 0),
  ('OPERASI KONTINJENSI', 'Peraturan Kepala Kepolisian Negara Republik Indonesia Nomor 17 Tahun 2009 tentang Manajemen Penanggulangan Bencana tanggal 22 Desember 2009;', 1),
  ('OPERASI KONTINJENSI', 'Peraturan Kepala Kepolisian Negara Republik Indonesia Nomor 8 Tahun 2021 tentang Perubahan atas Perkap Nomor 1 Tahun 2019 tentang Sistem, Manajemen dan Standar Keberhasilan Operasional Polri;', 2),
  ('OPERASI KONTINJENSI', 'Rengiat Polres Cimahi T.A. 2026.', 3)
) as v(nama_jenis, teks_dhb, urutan)
join public.jenis_kegiatan jk on jk.nama = v.nama_jenis
join public.dasar_hukum_baku dhb on dhb.teks = v.teks_dhb
on conflict (jenis_kegiatan_id, dasar_hukum_baku_id) do nothing;

-- Butir "Untuk" baku (ekor) -- generik untuk operasi/latihan internal.
insert into public.jenis_kegiatan_untuk_baku (jenis_kegiatan_id, teks, urutan)
select jk.id, v.teks, v.urutan
from (values
  ('OPERASI KONTINJENSI', 'melaksanakan perintah ini dengan saksama dan penuh rasa tanggung jawab;', 0),
  ('OPERASI KONTINJENSI', 'melaporkan hasil pelaksanaan tugas kepada Ka / Waka / Kabag Ops Polres Cimahi pada kesempatan pertama.', 1)
) as v(nama_jenis, teks, urutan)
join public.jenis_kegiatan jk on jk.nama = v.nama_jenis
on conflict do nothing;

-- Verifikasi:
select jk.id, jk.nama, jk.kode_klasifikasi, jk.kategori,
  (select count(*) from public.jenis_kegiatan_dasar_hukum where jenis_kegiatan_id = jk.id) as jml_dasar_hukum,
  (select count(*) from public.jenis_kegiatan_untuk_baku where jenis_kegiatan_id = jk.id) as jml_untuk_baku
from public.jenis_kegiatan jk where jk.nama = 'OPERASI KONTINJENSI';
