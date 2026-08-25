-- Celah skema ditemukan saat menyiapkan seed data historis: sprin_kelompok belum
-- punya kolom untuk "kelompok besar" (band gabungan beberapa tim, mis. "PIM STAF",
-- "SATUAN TUGAS") -- padahal field ini sudah ada di form Buat Sprin
-- ("Kelompok besar (opsional)") dan tampil di Riwayat Penugasan/Penugasan Saya
-- ("PIM STAF · KA OPS RES sebagai ..."). Tanpa kolom ini, data historis kehilangan
-- info pengelompokan itu dan foreign key-nya jadi ambigu (nama tim yang sama bisa
-- muncul di band berbeda dalam satu Sprin).

alter table public.sprin_kelompok add column kelompok_besar text;
