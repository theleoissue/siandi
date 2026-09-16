-- surat_perintah cuma punya 2 policy UPDATE (RLS-03/04: penyusun mengedit
-- draf sendiri; RLS-05: KABAG_OPS memutuskan) -- keduanya tidak dirancang
-- untuk menautkan file_asli_path ke Sprin yang sudah Terbit dan bukan disusun
-- oleh akun yang menjalankan skrip impor. Sama seperti hapus_surat_perintah,
-- pakai SECURITY DEFINER function supaya staf Bag Ops/Admin bisa menautkan
-- file arsip tanpa kena batasan alur draf/persetujuan itu.
create or replace function public.tetapkan_file_asli_sprin(p_nomor_agenda int, p_file_asli_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.peran_saya() not in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN') then
    raise exception 'Tidak punya izin menautkan file asli Sprin';
  end if;

  update public.surat_perintah
  set file_asli_path = p_file_asli_path
  where nomor_agenda = p_nomor_agenda;
end;
$$;

grant execute on function public.tetapkan_file_asli_sprin(int, text) to authenticated;
