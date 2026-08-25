import { supabase } from './supabase'

// BR-05: pencarian personel dari tabel pengguna (KUATPERS) langsung ke
// Supabase, bukan dari bundel personel.json -- supaya BR-15 (personel
// status_aktif=false tidak muncul di pencarian penempatan baru) benar-benar
// bisa ditegakkan (data aktif/nonaktif cuma ada di DB, tidak ada di bundel).

// Karakter yang berarti khusus buat filter PostgREST (.or/.ilike) dibuang dari
// kata kunci -- nama/NRP asli tidak butuh karakter ini, jadi aman dibuang.
function bersihkanKataKunci(teks) {
  return teks.replace(/[,()%*]/g, '').trim()
}

export async function cariPersonelDb(kataKunci, satuanFungsi, maks = 20) {
  const q = bersihkanKataKunci(kataKunci ?? '')
  if (q.length < 2 && !satuanFungsi) return []

  let query = supabase
    .from('pengguna')
    .select('id, nama, pangkat, nrp, jabatan_struktur, satuan_fungsi')
    .eq('status_aktif', true) // BR-15
    .not('nrp', 'is', null)
  if (satuanFungsi) query = query.eq('satuan_fungsi', satuanFungsi)
  if (q.length >= 2) query = query.or(`nama.ilike.%${q}%,nrp.ilike.%${q}%`)

  const { data, error } = await query.order('nama').limit(maks)
  if (error) throw error
  return (data ?? []).map((p) => ({
    id: p.id,
    nama: p.nama,
    pangkat: p.pangkat,
    nrp: p.nrp,
    jabatanStruktur: p.jabatan_struktur,
    satuanFungsi: p.satuan_fungsi,
  }))
}
