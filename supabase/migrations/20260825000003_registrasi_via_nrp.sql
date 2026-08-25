-- Pendaftaran akun via NRP (bukan email) -- disepakati pemilik proyek 2026-08-25,
-- sesuai layar login mockup yang memang pakai "Nomor Registrasi Pokok", bukan email.
-- Menggantikan rencana pembuatan 4 akun manual lewat Supabase Dashboard: sekarang
-- setiap personel di roster (tabel pengguna) BISA mendaftar sendiri, tapi HANYA jika
-- NRP-nya benar-benar ada di roster, aktif, dan belum pernah dipakai daftar.
--
-- Frontend tetap pakai email+password ke Supabase Auth di baliknya (satu-satunya
-- mekanisme native Supabase) -- emailnya disintesis dari NRP, mis. "87121335@siandi.local",
-- tidak pernah terlihat atau diketik user.

-- 1) Cek ketersediaan NRP untuk didaftarkan. Dipanggil SEBELUM signUp, saat user
-- belum login sama sekali -- karena itu perlu bisa dipanggil oleh anon.
-- Sengaja cuma kembalikan true/false, bukan data personel, supaya tidak jadi celah
-- untuk menebak-nebak/mendaftar seluruh isi roster.
create or replace function public.nrp_tersedia_untuk_registrasi(p_nrp text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pengguna
    where nrp = p_nrp
      and auth_user_id is null
      and status_aktif = true
  )
$$;

grant execute on function public.nrp_tersedia_untuk_registrasi(text) to anon, authenticated;

-- 2) Tautkan akun yang baru dibuat Supabase Auth ke baris pengguna sesuai NRP.
-- Dipanggil SETELAH signUp berhasil (saat auth.uid() sudah ada). SECURITY DEFINER
-- supaya bisa UPDATE pengguna.auth_user_id walau RLS pengguna normalnya tidak
-- mengizinkan user yang belum tertaut untuk mengubah baris apa pun.
create or replace function public.tautkan_akun_baru(p_nrp text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu';
  end if;

  update public.pengguna
  set auth_user_id = auth.uid()
  where nrp = p_nrp
    and auth_user_id is null
    and status_aktif = true;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'NRP tidak ditemukan, tidak aktif, atau sudah terdaftar';
  end if;
end;
$$;

grant execute on function public.tautkan_akun_baru(text) to authenticated;
