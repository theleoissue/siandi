const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu']
const BULAN_PENUH = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const BULAN_ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

function parseIso(isoDate) {
  return new Date(isoDate + 'T00:00:00')
}

export function namaHari(isoDate) {
  return HARI[parseIso(isoDate).getDay()]
}

export function tanggalPanjang(isoDate) {
  const d = parseIso(isoDate)
  return `${d.getDate()} ${BULAN_PENUH[d.getMonth()]} ${d.getFullYear()}`
}

export function tanggalDenganHari(isoDate) {
  return `${namaHari(isoDate)}, ${tanggalPanjang(isoDate)}`
}

export function tanggalSingkat(isoDate) {
  const d = parseIso(isoDate)
  return `${d.getDate()} ${BULAN_SINGKAT[d.getMonth()]} ${d.getFullYear()}`
}

export function romawiBulan(isoDate) {
  return BULAN_ROMAWI[parseIso(isoDate).getMonth()]
}

// Pola label waktu di tabel Daftar Sprin / Persetujuan, diambil dari mockup:
// satu hari -> "12 Agu 2026 · apel 08:00"; multi-hari -> "21 Feb 2026 – 2 Mar 2026 · tanpa apel tunggal"
export function labelWaktu({ tanggalMulai, tanggalSelesai, jamApel }) {
  if (tanggalMulai === tanggalSelesai) {
    return jamApel ? `${tanggalSingkat(tanggalMulai)} · apel ${jamApel}` : tanggalSingkat(tanggalMulai)
  }
  return `${tanggalSingkat(tanggalMulai)} – ${tanggalSingkat(tanggalSelesai)} · tanpa apel tunggal`
}
