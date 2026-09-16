-- Fitur hapus Sprin (semua status, termasuk yang sudah TERBIT) -- khusus staf
-- Bagian Operasi (KABAG_OPS/KASUBBAG_BINOPS/PAURMIN/STAF_ADMIN), bukan
-- KAPOLRES (read-only per RLS-08) atau PERSONEL. Dipakai untuk bersih-bersih
-- data uji coba/presentasi, bukan alur bisnis rutin.
--
-- Lewat SECURITY DEFINER function (pola sama seperti reset_password_staf_admin),
-- BUKAN lewat RLS DELETE policy biasa -- soalnya FK log_aktivitas_surat_perintah_id_fkey
-- terbukti TIDAK cascade di database live walau file migrasi awal menyatakan
-- begitu (lihat riwayat perbaikan hapus_semua_sprin_sebelum_data_asli.sql).
-- Function ini menghapus semua tabel anak secara eksplisit dalam satu
-- transaksi, tidak bergantung sama sekali pada cascade FK.
create or replace function public.hapus_surat_perintah(p_surat_perintah_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.peran_saya() not in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN') then
    raise exception 'Tidak punya izin menghapus Sprin';
  end if;

  if not exists (select 1 from public.surat_perintah where id = p_surat_perintah_id) then
    raise exception 'Sprin tidak ditemukan';
  end if;

  delete from public.log_aktivitas where surat_perintah_id = p_surat_perintah_id;
  delete from public.notifikasi where surat_perintah_id = p_surat_perintah_id;
  delete from public.sprin_dasar_hukum_baku where surat_perintah_id = p_surat_perintah_id;
  delete from public.dasar_hukum_rujukan where surat_perintah_id = p_surat_perintah_id;
  delete from public.sprin_personel
    where sprin_kelompok_id in (
      select id from public.sprin_kelompok where surat_perintah_id = p_surat_perintah_id
    );
  delete from public.sprin_kelompok where surat_perintah_id = p_surat_perintah_id;
  delete from public.surat_perintah where id = p_surat_perintah_id;
end;
$$;

grant execute on function public.hapus_surat_perintah(uuid) to authenticated;
