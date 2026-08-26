-- Wire-up kelima jenis kegiatan: dasar hukum baku + butir "Untuk" baku per
-- jenis, disimpan di DB (bukan lagi hardcode cuma Unjuk Rasa di frontend).
-- Teks diambil apa adanya dari 9 Sprin historis asli Polres Cimahi (file
-- DEPAN/DPN .docx), bukan karangan. Yang generik jadi baku; yang spesifik per
-- operasi (Renops/Infosus/Sprin Kapolda) tetap jalur rujukan manual per-Sprin.

-- 1) Koreksi kode klasifikasi KRYD: PAM.1.3.2 -> OPS.1.3 sesuai KEP/313/V/2010
-- (blueprint tata naskah Bagops). PAM.1 sebenarnya untuk Objek Vital Nasional;
-- KRYD adalah eskalasi operasi kewilayahan, jadi masuk rumpun OPS. Sprin lama
-- yang sudah terarsip tetap memakai kode lamanya (nomor_lengkap sudah tersimpan).
update public.jenis_kegiatan set kode_klasifikasi = 'OPS.1.3.'
where nama = 'KEGIATAN RUTIN YANG DITINGKATKAN';

-- 2) Durasi per-Sprin (BR-06). Jenis dengan wajib_isi_durasi_manual tidak punya
-- perkiraan_durasi_jam baku, jadi penyusun wajib mengisi durasi sebelum diajukan.
alter table public.surat_perintah add column if not exists durasi_jam int;

-- 3) Dua dasar hukum baku baru (selain 4 yang sudah ada untuk Unjuk Rasa).
insert into public.dasar_hukum_baku (teks, jenis) values
  ('Peraturan Polri Nomor 7 Tahun 2025 tentang Perubahan Peraturan Polri Nomor 2 Tahun 2021 tentang Susunan Organisasi dan Tata Kerja pada Tingkat Kepolisian Resor dan Kepolisian Sektor;', 'PERPOL'),
  ('Kalender Operasi Kewilayahan Polres Cimahi Tahun 2026.', 'PERATURAN_LAIN')
on conflict do nothing;

-- 4) Tabel butir "Untuk" baku per jenis kegiatan (ekor baku; butir 1-2 tetap
-- disusun dinamis dari perihal/tanggal/apel per BR-04, tidak disimpan di sini).
create table if not exists public.jenis_kegiatan_untuk_baku (
  id uuid primary key default gen_random_uuid(),
  jenis_kegiatan_id uuid not null references public.jenis_kegiatan(id) on delete cascade,
  teks text not null,
  urutan int not null default 0
);

-- 5) Relasi banyak-ke-banyak jenis kegiatan <-> dasar hukum baku (sebagian
-- dasar dipakai bersama beberapa jenis, mis. UU Kepolisian & Perkap 8/2021).
create table if not exists public.jenis_kegiatan_dasar_hukum (
  jenis_kegiatan_id uuid not null references public.jenis_kegiatan(id) on delete cascade,
  dasar_hukum_baku_id uuid not null references public.dasar_hukum_baku(id) on delete cascade,
  urutan int not null default 0,
  primary key (jenis_kegiatan_id, dasar_hukum_baku_id)
);

-- 6) RLS: baca untuk semua staf yang login, ubah untuk peran pengurus referensi
-- (sejajar dengan pola rls_10 tabel referensi lain).
alter table public.jenis_kegiatan_untuk_baku enable row level security;
alter table public.jenis_kegiatan_dasar_hukum enable row level security;

create policy jkub_select on public.jenis_kegiatan_untuk_baku
  for select using (public.peran_saya() is not null);
create policy jkub_modify on public.jenis_kegiatan_untuk_baku
  for all using (public.peran_saya() in ('KABAG_OPS','KASUBBAG_BINOPS','STAF_ADMIN'))
  with check (public.peran_saya() in ('KABAG_OPS','KASUBBAG_BINOPS','STAF_ADMIN'));

create policy jkdh_select on public.jenis_kegiatan_dasar_hukum
  for select using (public.peran_saya() is not null);
create policy jkdh_modify on public.jenis_kegiatan_dasar_hukum
  for all using (public.peran_saya() in ('KABAG_OPS','KASUBBAG_BINOPS','STAF_ADMIN'))
  with check (public.peran_saya() in ('KABAG_OPS','KASUBBAG_BINOPS','STAF_ADMIN'));

-- 7) Seed relasi dasar hukum baku per jenis (dicocokkan lewat nama jenis & teks
-- dasar supaya tidak tergantung UUID). Dijalankan idempotent via on conflict.
insert into public.jenis_kegiatan_dasar_hukum (jenis_kegiatan_id, dasar_hukum_baku_id, urutan)
select jk.id, dhb.id, v.urutan
from (values
  -- PENGAMANAN UNJUK RASA
  ('PENGAMANAN UNJUK RASA', 'Undang-Undang Nomor 5 Tahun 2026 tentang perubahan ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;', 0),
  ('PENGAMANAN UNJUK RASA', 'Perkap Nomor 1 Tahun 2009 tentang Penggunaan Kekuatan dalam Tindakan Kepolisian;', 1),
  ('PENGAMANAN UNJUK RASA', 'Peraturan Kepala Kepolisian Negara Republik Indonesia Nomor 8 Tahun 2021 tentang Perubahan atas Perkap Nomor 1 Tahun 2019 tentang Sistem, Manajemen dan Standar Keberhasilan Operasional Polri;', 2),
  ('PENGAMANAN UNJUK RASA', 'Rengiat Polres Cimahi T.A. 2026.', 3),
  -- KEGIATAN RUTIN YANG DITINGKATKAN
  ('KEGIATAN RUTIN YANG DITINGKATKAN', 'Undang-Undang Nomor 5 Tahun 2026 tentang perubahan ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;', 0),
  ('KEGIATAN RUTIN YANG DITINGKATKAN', 'Peraturan Polri Nomor 7 Tahun 2025 tentang Perubahan Peraturan Polri Nomor 2 Tahun 2021 tentang Susunan Organisasi dan Tata Kerja pada Tingkat Kepolisian Resor dan Kepolisian Sektor;', 1),
  ('KEGIATAN RUTIN YANG DITINGKATKAN', 'Peraturan Kepala Kepolisian Negara Republik Indonesia Nomor 8 Tahun 2021 tentang Perubahan atas Perkap Nomor 1 Tahun 2019 tentang Sistem, Manajemen dan Standar Keberhasilan Operasional Polri;', 2),
  ('KEGIATAN RUTIN YANG DITINGKATKAN', 'Rengiat Polres Cimahi T.A. 2026.', 3),
  -- OPERASI KEPOLISIAN HARI BESAR
  ('OPERASI KEPOLISIAN HARI BESAR', 'Undang-Undang Nomor 5 Tahun 2026 tentang perubahan ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;', 0),
  ('OPERASI KEPOLISIAN HARI BESAR', 'Rengiat Polres Cimahi T.A. 2026.', 1),
  -- OPERASI KEPOLISIAN KEWILAYAHAN
  ('OPERASI KEPOLISIAN KEWILAYAHAN', 'Undang-Undang Nomor 5 Tahun 2026 tentang perubahan ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;', 0),
  ('OPERASI KEPOLISIAN KEWILAYAHAN', 'Perkap Nomor 1 Tahun 2009 tentang Penggunaan Kekuatan dalam Tindakan Kepolisian;', 1),
  ('OPERASI KEPOLISIAN KEWILAYAHAN', 'Peraturan Kepala Kepolisian Negara Republik Indonesia Nomor 8 Tahun 2021 tentang Perubahan atas Perkap Nomor 1 Tahun 2019 tentang Sistem, Manajemen dan Standar Keberhasilan Operasional Polri;', 2),
  ('OPERASI KEPOLISIAN KEWILAYAHAN', 'Kalender Operasi Kewilayahan Polres Cimahi Tahun 2026.', 3),
  -- PENGAMANAN VIP/VVIP
  ('PENGAMANAN VIP/VVIP', 'Undang-Undang Nomor 5 Tahun 2026 tentang perubahan ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;', 0),
  ('PENGAMANAN VIP/VVIP', 'Peraturan Kepala Kepolisian Negara Republik Indonesia Nomor 8 Tahun 2021 tentang Perubahan atas Perkap Nomor 1 Tahun 2019 tentang Sistem, Manajemen dan Standar Keberhasilan Operasional Polri;', 1),
  ('PENGAMANAN VIP/VVIP', 'Rengiat Polres Cimahi T.A. 2026.', 2)
) as v(nama_jenis, teks_dhb, urutan)
join public.jenis_kegiatan jk on jk.nama = v.nama_jenis
join public.dasar_hukum_baku dhb on dhb.teks = v.teks_dhb
on conflict (jenis_kegiatan_id, dasar_hukum_baku_id) do nothing;

-- 8) Seed butir "Untuk" baku (ekor) per jenis.
insert into public.jenis_kegiatan_untuk_baku (jenis_kegiatan_id, teks, urutan)
select jk.id, v.teks, v.urutan
from (values
  ('PENGAMANAN UNJUK RASA', 'seluruh personel DILARANG MEMBAWA / MENGGUNAKAN SENJATA API dalam pelaksanaan tugas pengamanan;', 0),
  ('PENGAMANAN UNJUK RASA', 'personel menggunakan pakaian PDL-II Two Tone / menyesuaikan;', 1),
  ('PENGAMANAN UNJUK RASA', 'melaksanakan Koordinasi dan Komunikasi dengan pihak terkait;', 2),
  ('PENGAMANAN UNJUK RASA', 'melaksanakan perintah ini dengan saksama dan penuh rasa tanggung jawab;', 3),
  ('PENGAMANAN UNJUK RASA', 'melaporkan hasil pelaksanaan tugas kepada Ka / Waka / Kabag Ops Polres Cimahi pada kesempatan pertama.', 4),

  ('KEGIATAN RUTIN YANG DITINGKATKAN', 'pakaian PDL-II Two Tone memakai Rompi Hijau, Peluit, Borgol, Senter, untuk Sat Reserse, Sat Resnarkoba dan Sat Intelkam menyesuaikan;', 0),
  ('KEGIATAN RUTIN YANG DITINGKATKAN', 'melaksanakan perintah ini dengan saksama dan penuh rasa tanggung jawab;', 1),
  ('KEGIATAN RUTIN YANG DITINGKATKAN', 'melaporkan hasil pelaksanaan tugas kepada Ka / Waka / Kabag Ops Polres Cimahi pada kesempatan pertama.', 2),

  ('OPERASI KEPOLISIAN HARI BESAR', 'personel menggunakan pakaian PDL-II Two Tone dan khusus untuk Satgas Gakkum dan Subsatgas Intelkam menyesuaikan;', 0),
  ('OPERASI KEPOLISIAN HARI BESAR', 'melaksanakan perintah ini dengan saksama dan penuh rasa tanggung jawab;', 1),
  ('OPERASI KEPOLISIAN HARI BESAR', 'melaporkan hasil pelaksanaan tugas kepada Ka / Waka / Kabag Ops Polres Cimahi pada kesempatan pertama.', 2),

  ('OPERASI KEPOLISIAN KEWILAYAHAN', 'melaksanakan koordinasi dan kerjasama antar Satgas / Sub Satgas dan Instansi Terkait;', 0),
  ('OPERASI KEPOLISIAN KEWILAYAHAN', 'melaksanakan perintah ini dengan saksama dan penuh rasa tanggung jawab;', 1),
  ('OPERASI KEPOLISIAN KEWILAYAHAN', 'melaporkan hasil pelaksanaan tugas kepada Ka / Waka / Kabag Ops Polres Cimahi pada kesempatan pertama.', 2),

  ('PENGAMANAN VIP/VVIP', 'melaksanakan tugas sesuai dengan fungsinya dan koordinasi dengan instansi terkait;', 0),
  ('PENGAMANAN VIP/VVIP', 'melaksanakan perintah ini dengan saksama dan penuh rasa tanggung jawab;', 1),
  ('PENGAMANAN VIP/VVIP', 'melaporkan hasil pelaksanaan apel dan kegiatan kepada Ka / Waka / Kabag Ops Polres Cimahi pada kesempatan pertama.', 2)
) as v(nama_jenis, teks, urutan)
join public.jenis_kegiatan jk on jk.nama = v.nama_jenis
on conflict do nothing;
