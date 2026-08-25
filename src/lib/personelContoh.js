// Data personel asli dari KUATPERS (siandi_seed_v1.json), 1.176 baris.
// Statis untuk sekarang -- akan pindah jadi query tabel `pengguna` di Supabase
// begitu tahap "sambungkan data asli" jalan, tapi datanya sendiri sudah nyata.
import PERSONEL_DATA from '../data/personel.json'

export const PERSONEL_CONTOH = PERSONEL_DATA

export function cariPersonelContoh(kataKunci, maks = 20) {
  const q = kataKunci.trim().toLowerCase()
  if (q.length < 2) return []
  const hasil = []
  for (const p of PERSONEL_DATA) {
    if (p.nama.toLowerCase().includes(q) || p.nrp.includes(q)) {
      hasil.push(p)
      if (hasil.length >= maks) break
    }
  }
  return hasil
}
