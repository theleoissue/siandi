-- Perbaikan: pgcrypto (gen_salt/crypt) terpasang di schema `extensions`
-- (bawaan Supabase), bukan `public` -- search_path function sebelumnya
-- cuma "public" jadi gen_salt/crypt tidak ketemu.
create or replace function public.reset_password_staf_admin(p_nrp text, p_password_baru text)
returns void
language plpgsql
security definer
set search_path = public, extensions
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
