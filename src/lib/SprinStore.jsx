import { createContext, useContext, useState } from 'react'

// Sembilan Sprin nyata, diambil persis dari SIANDI_Mockup_v3.html (halaman Daftar Sprin).
// detailLengkap:false karena isi lengkap (pertimbangan/dasar/untuk/lampiran) belum
// diambil dari mockup untuk baris-baris ini — menyusul di tahap sambungkan data asli.
const SPRIN_AWAL = [
  {
    id: 'a1', nomorLengkap: 'Sprin/368/II/OPS.1.3./2026',
    perihal: 'Operasi Kepolisian Pekat I Lodaya 2026', jenisKegiatanNama: 'OPERASI KEPOLISIAN KEWILAYAHAN',
    waktuLabel: '21 Feb 2026 – 2 Mar 2026 · tanpa apel tunggal', jumlahPersonel: 44, jumlahKelompok: 17,
    status: 'Terbit', detailLengkap: false,
  },
  {
    id: 'a2', nomorLengkap: 'Sprin/535/III/OPS.1.2.3./2026',
    perihal: 'Pengamanan Hari Raya Idul Fitri 1447 H', jenisKegiatanNama: 'OPERASI KEPOLISIAN HARI BESAR',
    waktuLabel: '13 Mar 2026 – 25 Mar 2026 · tanpa apel tunggal', jumlahPersonel: 617, jumlahKelompok: 43,
    status: 'Terbit', detailLengkap: false,
  },
  {
    id: 'a3', nomorLengkap: 'Sprin/1421/VI/PAM.2.2./2026',
    perihal: 'Pengamanan Kedatangan Wakapolri ke Wilkum Polres Cimahi', jenisKegiatanNama: 'PENGAMANAN VIP/VVIP',
    waktuLabel: '20 Jun 2026 · apel 15:00', jumlahPersonel: 104, jumlahKelompok: 17,
    status: 'Terbit', detailLengkap: false,
  },
  {
    id: 'a4', nomorLengkap: 'Sprin/1491/VII/PAM.2.2./2026',
    perihal: 'Pengamanan Kunjungan Kerja Kapolri ke Sespim Lemdiklat Polri', jenisKegiatanNama: 'PENGAMANAN VIP/VVIP',
    waktuLabel: '2 Jul 2026 – 3 Jul 2026 · apel 09:00', jumlahPersonel: 315, jumlahKelompok: 20,
    status: 'Terbit', detailLengkap: false,
  },
  {
    id: 'a5', nomorLengkap: 'Sprin/1600/VII/PAM.3.2./2026',
    perihal: 'Pengamanan Aksi Unjuk Rasa Aliansi SP/SB Kota Cimahi', jenisKegiatanNama: 'PENGAMANAN UNJUK RASA',
    waktuLabel: '23 Jul 2026 · apel 09:00', jumlahPersonel: 242, jumlahKelompok: 40,
    status: 'Terbit', detailLengkap: false,
  },
  {
    id: 'a6', nomorLengkap: 'Sprin/1605/VII/PAM.1.3.2./2026',
    perihal: 'Kegiatan Rutin yang Ditingkatkan / Patroli dan Razia Skala Besar', jenisKegiatanNama: 'KEGIATAN RUTIN YANG DITINGKATKAN',
    waktuLabel: '25 Jul 2026 · apel 21:00', jumlahPersonel: 54, jumlahKelompok: 15,
    status: 'Terbit', detailLengkap: false,
  },
  {
    id: 'a7', nomorLengkap: 'Sprin/1686/VII/PAM.1.3.2./2026',
    perihal: 'Kegiatan Rutin yang Ditingkatkan / Patroli dan Razia Skala Besar', jenisKegiatanNama: 'KEGIATAN RUTIN YANG DITINGKATKAN',
    waktuLabel: '26 Jul 2026 · apel 21:00', jumlahPersonel: 35, jumlahKelompok: 6,
    status: 'Terbit', detailLengkap: false,
  },
  {
    id: 'a8', nomorLengkap: 'Sprin/1694/VII/PAM.3.2./2026',
    perihal: 'Pengamanan Keberangkatan Massa KC FSPMI dan DPC SPN ke Kemendagri Jakarta', jenisKegiatanNama: 'PENGAMANAN UNJUK RASA',
    waktuLabel: '28 Jul 2026 · apel 05:30', jumlahPersonel: 28, jumlahKelompok: 12,
    status: 'Terbit', detailLengkap: false,
  },
  {
    id: 'a9', nomorLengkap: 'Sprin/1702/VII/PAM.3.2./2026',
    perihal: 'Pengamanan Aksi Unjuk Rasa Koalisi 7 SP-SB Kab. Bandung Barat', jenisKegiatanNama: 'PENGAMANAN UNJUK RASA',
    waktuLabel: '30 Jul 2026 · apel 08:00', jumlahPersonel: 86, jumlahKelompok: 10,
    status: 'Terbit', detailLengkap: false,
  },
]

export const STATUS_BADGE_STYLE = {
  Terbit: { backgroundColor: '#E8F5EE', color: '#1F7A4D' },
  'Menunggu Persetujuan': { backgroundColor: '#FDF6E3', color: '#8A6100' },
  Dikembalikan: { backgroundColor: '#FDECEA', color: '#B3261E' },
}

const SprinContext = createContext(null)

export function SprinStoreProvider({ children }) {
  const [daftar, setDaftar] = useState(SPRIN_AWAL)
  const [nextId, setNextId] = useState(1)

  function ajukanSprin(data) {
    const id = `baru-${nextId}`
    setNextId((n) => n + 1)
    setDaftar((prev) => [{ ...data, id, status: 'Menunggu Persetujuan', detailLengkap: true }, ...prev])
    return id
  }

  function setujuiSprin(id, catatanPemeriksaan) {
    setDaftar((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Terbit', catatanPemeriksaan: catatanPemeriksaan || null } : s)),
    )
  }

  function kembalikanSprin(id, catatanPemeriksaan) {
    setDaftar((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Dikembalikan', catatanPemeriksaan } : s)),
    )
  }

  function cariSprin(id) {
    return daftar.find((s) => s.id === id) ?? null
  }

  return (
    <SprinContext.Provider value={{ daftar, ajukanSprin, setujuiSprin, kembalikanSprin, cariSprin }}>
      {children}
    </SprinContext.Provider>
  )
}

export function useSprinStore() {
  const ctx = useContext(SprinContext)
  if (!ctx) throw new Error('useSprinStore harus dipakai di dalam SprinStoreProvider')
  return ctx
}
