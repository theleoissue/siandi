import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SegeraHadir from './pages/SegeraHadir'

// Sementara: user contoh untuk kerja tahap breakout tampilan.
// Akan diganti sesi auth Supabase asli di tahap "sambungkan data asli".
const CONTOH_USER = {
  nama: 'AKP DEVI PUSPA SARI, S.Pd., M.M.',
  jabatan: 'KASUBBAG BINOPS BAG OPS',
  peran_sistem: 'KASUBBAG_BINOPS',
  jumlahPersonel: 1171,
  jumlahSprin: 9,
}

export default function App() {
  const [viewAsRole, setViewAsRole] = useState('binops')

  return (
    <Routes>
      <Route
        element={
          <Layout
            user={CONTOH_USER}
            viewAsRole={viewAsRole}
            onChangeViewAsRole={setViewAsRole}
            onKeluar={() => {}}
          />
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/buat-sprin" element={<SegeraHadir judul="Buat Sprin" />} />
        <Route path="/daftar-sprin" element={<SegeraHadir judul="Daftar Sprin" />} />
        <Route path="/arsip" element={<SegeraHadir judul="Arsip & Pencarian" />} />
        <Route path="/riwayat" element={<SegeraHadir judul="Riwayat Penugasan" />} />
        <Route path="/notifikasi" element={<SegeraHadir judul="Notifikasi" />} />
      </Route>
    </Routes>
  )
}
