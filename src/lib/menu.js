// Daftar menu per peran, diambil persis dari SIANDI_Mockup_v3.html
// (dicek satu-satu lewat DOM untuk tiap opsi "Lihat sebagai").
export const MENU_KAPOLRES = [
  { key: 'dashboard', label: 'Dashboard', path: '/' },
  { key: 'daftar-sprin', label: 'Daftar Sprin', path: '/daftar-sprin' },
  { key: 'arsip', label: 'Arsip & Pencarian', path: '/arsip' },
  { key: 'riwayat', label: 'Riwayat Penugasan', path: '/riwayat' },
  { key: 'notifikasi', label: 'Notifikasi', path: '/notifikasi' },
  { key: 'log-aktivitas', label: 'Log Aktivitas', path: '/log-aktivitas' },
]

export const MENU_KABAG_OPS = [
  { key: 'dashboard', label: 'Dashboard', path: '/' },
  { key: 'daftar-sprin', label: 'Daftar Sprin', path: '/daftar-sprin' },
  { key: 'persetujuan', label: 'Persetujuan', path: '/persetujuan' },
  { key: 'arsip', label: 'Arsip & Pencarian', path: '/arsip' },
  { key: 'riwayat', label: 'Riwayat Penugasan', path: '/riwayat' },
  { key: 'notifikasi', label: 'Notifikasi', path: '/notifikasi' },
  { key: 'log-aktivitas', label: 'Log Aktivitas', path: '/log-aktivitas' },
]

export const MENU_BINOPS = [
  { key: 'dashboard', label: 'Dashboard', path: '/' },
  { key: 'buat-sprin', label: 'Buat Sprin', path: '/buat-sprin' },
  { key: 'daftar-sprin', label: 'Daftar Sprin', path: '/daftar-sprin' },
  { key: 'arsip', label: 'Arsip & Pencarian', path: '/arsip' },
  { key: 'riwayat', label: 'Riwayat Penugasan', path: '/riwayat' },
  { key: 'notifikasi', label: 'Notifikasi', path: '/notifikasi' },
]

// Catatan: mockup menggabungkan PAURMIN & STAF_ADMIN (PRD) jadi satu opsi demo "admin".
export const MENU_ADMIN = [
  { key: 'dashboard', label: 'Dashboard', path: '/' },
  { key: 'buat-sprin', label: 'Buat Sprin', path: '/buat-sprin' },
  { key: 'daftar-sprin', label: 'Daftar Sprin', path: '/daftar-sprin' },
  { key: 'arsip', label: 'Arsip & Pencarian', path: '/arsip' },
  { key: 'notifikasi', label: 'Notifikasi', path: '/notifikasi' },
  { key: 'data-personel', label: 'Data Personel', path: '/data-personel' },
  { key: 'jenis-kegiatan', label: 'Jenis Kegiatan', path: '/jenis-kegiatan' },
  { key: 'manajemen-pengguna', label: 'Manajemen Pengguna', path: '/manajemen-pengguna' },
  { key: 'log-aktivitas', label: 'Log Aktivitas', path: '/log-aktivitas' },
]

export const MENU_PERSONEL = [
  { key: 'penugasan-saya', label: 'Penugasan Saya', path: '/' },
  { key: 'notifikasi', label: 'Notifikasi', path: '/notifikasi' },
]

export const MENU_BY_ROLE = {
  KAPOLRES: MENU_KAPOLRES,
  KABAG_OPS: MENU_KABAG_OPS,
  KASUBBAG_BINOPS: MENU_BINOPS,
  PAURMIN: MENU_ADMIN,
  STAF_ADMIN: MENU_ADMIN,
  PERSONEL: MENU_PERSONEL,
}

// Identitas contoh per peran — dari mockup (data KUATPERS asli), dipakai untuk
// fitur demo "Lihat sebagai" di topbar. Akan diganti sesi auth Supabase di step 4.
export const CONTOH_USER_BY_VIEW_ROLE = {
  pimpinan: {
    nama: 'AKBP MOH. FARUK ROZI, S.H, S.I.K., M.Si',
    jabatan: 'KAPOLRES CIMAHI',
    peran_sistem: 'KAPOLRES',
  },
  kabagops: {
    nama: 'KOMPOL SAEFUL BAHRI, S. Pd. I.',
    jabatan: 'KABAG OPS',
    peran_sistem: 'KABAG_OPS',
  },
  binops: {
    nama: 'AKP DEVI PUSPA SARI, S.Pd., M.M.',
    jabatan: 'KASUBBAG BINOPS BAG OPS',
    peran_sistem: 'KASUBBAG_BINOPS',
    nrp: '87121335',
  },
  admin: {
    nama: 'IPDA RD ALI NURJAMAL, S.Psi., M.M.',
    jabatan: 'PAURMIN BAG OPS',
    peran_sistem: 'PAURMIN',
  },
  personel: {
    nama: '—',
    jabatan: '',
    peran_sistem: 'PERSONEL',
  },
}
