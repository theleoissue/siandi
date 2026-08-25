-- Tambah roster STAF_ADMIN untuk tim cyber Polres Cimahi (NRP 040440).
-- Sumber 'MANUAL' karena bukan bagian dari import KUATPERS bulanan, melainkan
-- akun sistem yang sengaja dibuat buat pegang fitur reset password admin.
insert into public.pengguna (nama, nrp, peran_sistem, sumber_data, status_aktif)
values ('ADMIN SIANDI', '040440', 'STAF_ADMIN', 'MANUAL', true);
