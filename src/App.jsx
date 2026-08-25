import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import BuatSprin from './pages/BuatSprin'
import DaftarSprin from './pages/DaftarSprin'
import Persetujuan from './pages/Persetujuan'
import SprinDetail from './pages/SprinDetail'
import SegeraHadir from './pages/SegeraHadir'
import { CONTOH_USER_BY_VIEW_ROLE } from './lib/menu'
import { SprinStoreProvider } from './lib/SprinStore'

// Sementara: identitas & peran dikendalikan dropdown "Lihat sebagai" (fitur demo,
// sama seperti mockup). Akan diganti sesi auth Supabase asli di tahap berikutnya.
export default function App() {
  const [viewAsRole, setViewAsRole] = useState('binops')
  const user = CONTOH_USER_BY_VIEW_ROLE[viewAsRole]

  return (
    <SprinStoreProvider>
      <Routes>
        <Route
          element={
            <Layout
              user={user}
              jumlahPersonel={1171}
              jumlahSprin={9}
              viewAsRole={viewAsRole}
              onChangeViewAsRole={setViewAsRole}
              onKeluar={() => {}}
            />
          }
        >
          <Route
            path="/"
            element={user.peran_sistem === 'PERSONEL' ? <SegeraHadir judul="Penugasan Saya" /> : <Dashboard />}
          />
          <Route path="/buat-sprin" element={<BuatSprin />} />
          <Route path="/daftar-sprin" element={<DaftarSprin />} />
          <Route path="/persetujuan" element={<Persetujuan />} />
          <Route path="/sprin/:id" element={<SprinDetail peranSaya={user.peran_sistem} />} />
          <Route path="/arsip" element={<SegeraHadir judul="Arsip & Pencarian" />} />
          <Route path="/riwayat" element={<SegeraHadir judul="Riwayat Penugasan" />} />
          <Route path="/notifikasi" element={<SegeraHadir judul="Notifikasi" />} />
          <Route path="/data-personel" element={<SegeraHadir judul="Data Personel" />} />
          <Route path="/jenis-kegiatan" element={<SegeraHadir judul="Jenis Kegiatan" />} />
          <Route path="/manajemen-pengguna" element={<SegeraHadir judul="Manajemen Pengguna" />} />
          <Route path="/log-aktivitas" element={<SegeraHadir judul="Log Aktivitas" />} />
        </Route>
      </Routes>
    </SprinStoreProvider>
  )
}
