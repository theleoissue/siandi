// Daftar menu per peran. Path & label diambil persis dari SIANDI_Mockup_v3.html
// (role binops sudah diverifikasi langsung; role lain menyusul saat halamannya dibangun).
export const MENU_BINOPS = [
  { key: 'dashboard', label: 'Dashboard', path: '/' },
  { key: 'buat-sprin', label: 'Buat Sprin', path: '/buat-sprin' },
  { key: 'daftar-sprin', label: 'Daftar Sprin', path: '/daftar-sprin' },
  { key: 'arsip', label: 'Arsip & Pencarian', path: '/arsip' },
  { key: 'riwayat', label: 'Riwayat Penugasan', path: '/riwayat' },
  { key: 'notifikasi', label: 'Notifikasi', path: '/notifikasi' },
]

export const MENU_BY_ROLE = {
  KASUBBAG_BINOPS: MENU_BINOPS,
  PAURMIN: MENU_BINOPS,
}
