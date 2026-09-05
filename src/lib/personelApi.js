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

// Halaman Data Personel: daftar roster KUATPERS lengkap (semua status_aktif,
// bukan cuma yang aktif seperti pencarian penempatan BR-15) dengan pencarian,
// filter satuan fungsi, dan paginasi asli lewat range() -- roster ini ribuan
// baris, jangan pernah ditarik sekaligus ke client.
export async function ambilDaftarPersonel({ kataKunci = '', satuanFungsi = '', halaman = 0, ukuranHalaman = 25 } = {}) {
  const q = bersihkanKataKunci(kataKunci)
  let query = supabase
    .from('pengguna')
    .select('id, nama, pangkat, nrp, jabatan_struktur, satuan_fungsi, status_aktif', { count: 'exact' })
  if (satuanFungsi) query = query.eq('satuan_fungsi', satuanFungsi)
  if (q) query = query.or(`nama.ilike.%${q}%,nrp.ilike.%${q}%,jabatan_struktur.ilike.%${q}%`)

  const dari = halaman * ukuranHalaman
  const { data, error, count } = await query.order('nama').range(dari, dari + ukuranHalaman - 1)
  if (error) throw error
  return { baris: data ?? [], total: count ?? 0 }
}

// Personel di luar KUATPERS (BKO/mutasi/pensiun/lainnya) -- tabel terpisah,
// tidak butuh akun auth, dan sudah dipakai lewat jalur "tambah manual" saat
// Buat Sprin (lihat sprinApi.js). Di sini jadi direktori mandiri: sekali
// didaftarkan, bisa dipakai berkali-kali di Sprin manapun.
export async function ambilDaftarNonKuatpers({ kataKunci = '', halaman = 0, ukuranHalaman = 25 } = {}) {
  const q = bersihkanKataKunci(kataKunci)
  let query = supabase
    .from('personel_non_kuatpers')
    .select('id, nama, pangkat, nrp, jabatan_asal, keterangan, catatan, created_at', { count: 'exact' })
  if (q) query = query.or(`nama.ilike.%${q}%,nrp.ilike.%${q}%,jabatan_asal.ilike.%${q}%`)

  const dari = halaman * ukuranHalaman
  const { data, error, count } = await query.order('created_at', { ascending: false }).range(dari, dari + ukuranHalaman - 1)
  if (error) throw error
  return { baris: data ?? [], total: count ?? 0 }
}

export async function tambahPersonelNonKuatpers({ nama, nrp, pangkat, jabatanAsal, keterangan, catatan, diinputOleh }) {
  const { error } = await supabase.from('personel_non_kuatpers').insert({
    nama: nama.trim(),
    nrp: nrp?.trim() || null,
    pangkat: pangkat?.trim() || null,
    jabatan_asal: jabatanAsal?.trim() || null,
    keterangan,
    catatan: catatan?.trim() || null,
    diinput_oleh: diinputOleh,
  })
  if (error) throw error
}
