import { supabase } from './supabase'

// BR-06/07/08/09: deteksi bentrok penugasan personel lintas Sprin.
// - Kelompok PELAKSANA (rotasi tim lapangan): bentrok dicek per-hari, memakai
//   jendela jam_apel..+perkiraan_durasi_jam (BR-06) pada tanggal yang sama.
// - Kelompok PENGENDALI (band struktural, "kunci_penuh_durasi"): dianggap
//   bertugas sepanjang rentang tanggal Sprin-nya -- irisan tanggal saja sudah
//   cukup jadi bentrok, tanpa perlu granularitas jam.
// Kalau salah satu sisi PENGENDALI, sisi itu yang menentukan "penuh rentang".

function formatTanggalLokal(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function daftarTanggal(mulai, selesai) {
  // Pakai getter tanggal lokal, bukan toISOString() (yang mengonversi ke UTC dan
  // bisa mundur satu hari kalau zona waktu lokal browser lebih maju dari UTC, mis. WIB).
  const hasil = []
  const d = new Date(mulai + 'T00:00:00')
  const akhir = new Date(selesai + 'T00:00:00')
  while (d <= akhir) {
    hasil.push(formatTanggalLokal(d))
    d.setDate(d.getDate() + 1)
  }
  return hasil
}

function jendelaJam(tanggal, jamApel, durasiJam) {
  if (!jamApel || !durasiJam) return null
  const mulai = new Date(`${tanggal}T${jamApel}`)
  return [mulai, new Date(mulai.getTime() + durasiJam * 3600 * 1000)]
}

function beririsan(a, b) {
  return a[0] < b[1] && b[0] < a[1]
}

function rentangBeririsan(mulai1, selesai1, mulai2, selesai2) {
  return mulai1 <= selesai2 && mulai2 <= selesai1
}

// riwayat: array hasil ambilRiwayatPenugasanNrp(). kandidat: penempatan yang
// sedang disusun (belum tersimpan). Mengembalikan daftar konflik, masing-masing
// dengan flag `menonjol` (BR-08: true kalau kelompok yang SEDANG disusun bersifat
// PELAKSANA, jadi warning ditampilkan mencolok; false kalau PENGENDALI, cuma
// keterangan biasa).
export function cekBentrok(kandidat, riwayat) {
  const { tanggalMulai, tanggalSelesai, jamApel, durasiJam, sifat } = kandidat
  const konflik = []
  for (const r of riwayat) {
    if (sifat === 'PELAKSANA' && r.sifat === 'PELAKSANA') {
      const tglKandidat = daftarTanggal(tanggalMulai, tanggalSelesai)
      const tglRiwayat = new Set(daftarTanggal(r.tanggalMulai, r.tanggalSelesai))
      for (const t of tglKandidat) {
        if (!tglRiwayat.has(t)) continue
        const w1 = jendelaJam(t, jamApel, durasiJam)
        const w2 = jendelaJam(t, r.jamApel, r.durasiJam)
        if (!w1 || !w2 || beririsan(w1, w2)) {
          konflik.push({ ...r, tanggalBentrok: t, menonjol: true })
        }
      }
    } else if (rentangBeririsan(tanggalMulai, tanggalSelesai, r.tanggalMulai, r.tanggalSelesai)) {
      konflik.push({ ...r, tanggalBentrok: null, menonjol: sifat === 'PELAKSANA' })
    }
  }
  return konflik
}

export async function ambilRiwayatPenugasanNrp(nrp) {
  const { data, error } = await supabase
    .from('pengguna')
    .select(`
      sprin_personel (
        sprin_kelompok ( sifat,
          surat_perintah ( nomor_lengkap, perihal, tanggal_mulai, tanggal_selesai, jam_apel, status, durasi_jam,
            jenis_kegiatan ( perkiraan_durasi_jam ) )
        )
      )
    `)
    .eq('nrp', nrp)
    .maybeSingle()
  if (error) throw error
  return (data?.sprin_personel ?? [])
    .filter((row) => {
      const sp = row.sprin_kelompok?.surat_perintah
      return sp && (sp.status === 'TERBIT' || sp.status === 'MENUNGGU_PERSETUJUAN')
    })
    .map((row) => {
      const sp = row.sprin_kelompok.surat_perintah
      return {
        nomorLengkap: sp.nomor_lengkap,
        perihal: sp.perihal,
        tanggalMulai: sp.tanggal_mulai,
        tanggalSelesai: sp.tanggal_selesai,
        jamApel: sp.jam_apel?.slice(0, 5) ?? null,
        // durasi_jam (BR-06, per-Sprin -- termasuk yang diisi manual untuk jenis
        // operasi) dulu, baru fallback ke perkiraan baku jenis kegiatan untuk
        // Sprin lama yang dibuat sebelum kolom durasi_jam ada.
        durasiJam: sp.durasi_jam ?? sp.jenis_kegiatan?.perkiraan_durasi_jam ?? null,
        sifat: row.sprin_kelompok.sifat,
      }
    })
}
