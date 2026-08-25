-- Penandatangan Sprin: sesuai catatan PRD, Kapolres/Waka bukan node alur kerja --
-- mereka cuma "nama penanggung jawab/penandatangan dokumen", terpisah dari siapa
-- yang approve (disetujui_oleh, selalu KABAG_OPS). Jadi field ini disimpan lepas,
-- bisa siapa saja dari roster pengguna (termasuk yang tidak punya akun login sama
-- sekali), dan dipilih belakangan (bukan pas draf dibuat).
alter table public.surat_perintah
  add column penandatangan_id uuid references public.pengguna(id);

-- Yang boleh menetapkan/mengubah penandatangan: staf yang memang mengurus proses
-- administrasi Sprin (Kasubbag Binops selaku penyusun/penurun Sprin, Paurmin, dan
-- Staf Admin) -- bukan Kabag Ops (dia cuma approve) atau Kapolres/personel biasa.
-- Lewat RPC (bukan RLS UPDATE biasa) supaya hanya kolom ini yang bisa diubah,
-- tidak seluruh baris surat_perintah.
create or replace function public.tetapkan_penandatangan(p_sprin_id uuid, p_penandatangan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.peran_saya() not in ('KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN') then
    raise exception 'Tidak punya izin menetapkan penandatangan';
  end if;

  update public.surat_perintah
  set penandatangan_id = p_penandatangan_id
  where id = p_sprin_id
    and status = 'TERBIT';

  if not found then
    raise exception 'Sprin tidak ditemukan atau belum berstatus TERBIT';
  end if;
end;
$$;

grant execute on function public.tetapkan_penandatangan(uuid, uuid) to authenticated;
