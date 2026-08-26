-- Seragamkan izin ubah data template jenis kegiatan. Semula RLS-10 hanya
-- mengizinkan STAF_ADMIN, tapi yang paling paham struktur satgas & dasar hukum
-- adalah staf operasional (Kasubbag Binops selaku penyusun Sprin, Paurmin).
-- STAF_ADMIN (tim cyber) tetap boleh. Kabag Ops tidak (dia hanya menyetujui).
-- Berlaku untuk seluruh tabel yang menyusun satu preset jenis kegiatan.

do $$
declare
  peran_boleh text := $q$public.peran_saya() in ('KASUBBAG_BINOPS','PAURMIN','STAF_ADMIN')$q$;
begin
  execute 'drop policy if exists rls_10_modify_jenis_kegiatan on public.jenis_kegiatan';
  execute 'create policy rls_10_modify_jenis_kegiatan on public.jenis_kegiatan for all using ('||peran_boleh||') with check ('||peran_boleh||')';

  execute 'drop policy if exists rls_10_modify_jenis_kegiatan_kelompok on public.jenis_kegiatan_kelompok';
  execute 'create policy rls_10_modify_jenis_kegiatan_kelompok on public.jenis_kegiatan_kelompok for all using ('||peran_boleh||') with check ('||peran_boleh||')';

  execute 'drop policy if exists rls_10_modify_dasar_hukum_baku on public.dasar_hukum_baku';
  execute 'create policy rls_10_modify_dasar_hukum_baku on public.dasar_hukum_baku for all using ('||peran_boleh||') with check ('||peran_boleh||')';

  execute 'drop policy if exists jkub_modify on public.jenis_kegiatan_untuk_baku';
  execute 'create policy jkub_modify on public.jenis_kegiatan_untuk_baku for all using ('||peran_boleh||') with check ('||peran_boleh||')';

  execute 'drop policy if exists jkdh_modify on public.jenis_kegiatan_dasar_hukum';
  execute 'create policy jkdh_modify on public.jenis_kegiatan_dasar_hukum for all using ('||peran_boleh||') with check ('||peran_boleh||')';
end $$;
