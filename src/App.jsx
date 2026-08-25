import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import BuatSprin from './pages/BuatSprin'
import DaftarSprin from './pages/DaftarSprin'
import Persetujuan from './pages/Persetujuan'
import SprinDetail from './pages/SprinDetail'
import Notifikasi from './pages/Notifikasi'
import RiwayatPenugasan from './pages/RiwayatPenugasan'
import Arsip from './pages/Arsip'
import DataPersonel from './pages/DataPersonel'
import JenisKegiatan from './pages/JenisKegiatan'
import SegeraHadir from './pages/SegeraHadir'
import { CONTOH_USER_BY_VIEW_ROLE } from './lib/menu'
import { SprinStoreProvider } from './lib/SprinStore'
import { PERSONEL_CONTOH } from './lib/personelContoh'

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
              jumlahPersonel={PERSONEL_CONTOH.length}
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
          <Route path="/arsip" element={<Arsip />} />
          <Route path="/riwayat" element={<RiwayatPenugasan />} />
          <Route path="/notifikasi" element={<Notifikasi nrpSaya={user.nrp} />} />
          <Route path="/data-personel" element={<DataPersonel />} />
          <Route path="/jenis-kegiatan" element={<JenisKegiatan />} />
          <Route path="/manajemen-pengguna" element={<SegeraHadir judul="Manajemen Pengguna" />} />
          <Route path="/log-aktivitas" element={<SegeraHadir judul="Log Aktivitas" />} />
        </Route>
      </Routes>
    </SprinStoreProvider>
  )
}
