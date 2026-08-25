-- Reset password akun lain, khusus STAF_ADMIN -- lewat SECURITY DEFINER
-- function langsung di database, bukan Edge Function. Menghindari kerumitan
-- sistem key baru Supabase (publishable/secret) yang bikin service_role key
-- klasik gagal bypass RLS di project ini ("permission denied for table
-- pengguna" walau sudah pakai SUPABASE_SERVICE_ROLE_KEY).
--
-- Password di-hash langsung dengan pgcrypto (bcrypt), skema yang sama dipakai
-- Supabase Auth (GoTrue) sendiri untuk auth.users.encrypted_password.
create extension if not exists pgcrypto;

create or replace function public.reset_password_staf_admin(p_nrp text, p_password_baru text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_auth_id uuid;
begin
  if public.peran_saya() <> 'STAF_ADMIN' then
    raise exception 'Tidak punya izin mereset password';
  end if;

  if length(p_password_baru) < 6 then
    raise exception 'Password minimal 6 karakter';
  end if;

  select auth_user_id into v_target_auth_id
  from public.pengguna
  where nrp = p_nrp;

  if v_target_auth_id is null then
    raise exception 'NRP tidak ditemukan atau belum punya akun login';
  end if;

  update auth.users
  set encrypted_password = crypt(p_password_baru, gen_salt('bf'))
  where id = v_target_auth_id;
end;
$$;

grant execute on function public.reset_password_staf_admin(text, text) to authenticated;
