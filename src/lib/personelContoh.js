// Data personel asli dari KUATPERS (siandi_seed_v1.json), 1.176 baris.
// Statis untuk sekarang -- akan pindah jadi query tabel `pengguna` di Supabase
// begitu tahap "sambungkan data asli" jalan, tapi datanya sendiri sudah nyata.
import PERSONEL_DATA from '../data/personel.json'

export const PERSONEL_CONTOH = PERSONEL_DATA

export const SATUAN_FUNGSI_OPTIONS = [...new Set(PERSONEL_DATA.map((p) => p.satuanFungsi))].sort()

// satuanFungsi opsional: kalau diisi, cari hanya di dalam bagian itu. Kalau kata
// kunci masih kosong tapi bagian sudah dipilih, tampilkan anggota bagian itu
// langsung (tanpa perlu ketik nama dulu) supaya bisa "menjelajah per bagian".
export function cariPersonelContoh(kataKunci, satuanFungsi, maks = 20) {
  const q = kataKunci.trim().toLowerCase()
  const sumber = satuanFungsi ? PERSONEL_DATA.filter((p) => p.satuanFungsi === satuanFungsi) : PERSONEL_DATA
  if (q.length < 2) {
    return satuanFungsi ? sumber.slice(0, maks) : []
  }
  const hasil = []
  for (const p of sumber) {
    if (p.nama.toLowerCase().includes(q) || p.nrp.includes(q)) {
      hasil.push(p)
      if (hasil.length >= maks) break
    }
  }
  return hasil
}
