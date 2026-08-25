-- Bug di trg_surat_perintah_before_write: pengecekan "status TERBIT hanya bisa
-- dicapai otomatis dari DISETUJUI (RLS-06)" ternyata memblokir SEMUA update ke
-- baris yang statusnya sudah TERBIT -- termasuk update yang sama sekali tidak
-- menyentuh kolom status (misal tetapkan_penandatangan). Sebabnya: pengecekan
-- lama cuma lihat new.status = 'TERBIT' dan old.status <> 'DISETUJUI', tanpa
-- peduli apakah status itu benar-benar berubah pada UPDATE ini atau tidak.
-- Ketahuan lewat pengujian nyata fitur pemilihan penandatangan.
create or replace function public.trg_surat_perintah_before_write()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'DIKEMBALIKAN' and coalesce(new.catatan_pemeriksaan, '') = '' then
    raise exception 'catatan_pemeriksaan wajib diisi saat mengembalikan draf (BR-11)';
  end if;

  if new.status = 'MENUNGGU_PERSETUJUAN' and new.nomor_agenda is null then
    raise exception 'nomor_agenda wajib diisi sebelum diajukan (BR-17)';
  end if;

  if new.status = 'TERBIT'
     and (TG_OP = 'INSERT' or (old.status is distinct from new.status and old.status is distinct from 'DISETUJUI')) then
    raise exception 'status TERBIT hanya bisa dicapai otomatis dari DISETUJUI (RLS-06)';
  end if;

  if new.status = 'DISETUJUI' then
    if new.disetujui_oleh is null then
      new.disetujui_oleh := public.pengguna_id_saya();
    end if;
    if new.disetujui_pada is null then
      new.disetujui_pada := now();
    end if;
    new.status := 'TERBIT';
  end if;

  if new.nomor_agenda is not null then
    new.nomor_lengkap := 'SPRIN/' || new.nomor_agenda || '/' ||
      public.bulan_romawi(extract(month from new.tanggal_mulai)::int) || '/' ||
      (select kode_klasifikasi from public.jenis_kegiatan where id = new.jenis_kegiatan_id) ||
      '/' || extract(year from new.tanggal_mulai)::text;
  end if;

  if TG_OP = 'UPDATE' then
    new.updated_at := now();
  end if;

  return new;
end;
$$;
