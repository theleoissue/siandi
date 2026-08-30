-- Lepas akun test yang masih nyangkut di NRP Saeful Bahri (KABAG_OPS) dan
-- Ali Nurjamal (PAURMIN) sebelum serah terima -- supaya mereka bisa daftar
-- sendiri dengan password pilihan sendiri lewat halaman Login.
delete from auth.users where email in ('nrp76010326@siandi.app', 'nrp87110847@siandi.app');
