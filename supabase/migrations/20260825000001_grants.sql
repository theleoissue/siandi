-- Grant dasar untuk role anon & authenticated.
-- RLS (migration sebelumnya) menyaring BARIS mana yang boleh diakses,
-- tapi Postgres tetap butuh GRANT dasar di level TABEL sebelum RLS sempat dievaluasi.
-- Tanpa ini semua query dari anon/authenticated kena "permission denied" duluan.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on all tables in schema public
  to anon, authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;

-- supaya tabel yang dibuat migration berikutnya otomatis ikut ter-grant juga
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;

alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
