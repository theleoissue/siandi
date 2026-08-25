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
import ManajemenPengguna from './pages/ManajemenPengguna'
import LogAktivitas from './pages/LogAktivitas'
import PenugasanSaya from './pages/PenugasanSaya'
import Login from './pages/Login'
import { SprinStoreProvider } from './lib/SprinStore'
import { PERSONEL_CONTOH } from './lib/personelContoh'
import { AuthProvider } from './lib/AuthContext'
import { useAuth, keluar } from './lib/auth'

function AppRoutes() {
  const { session, profil, sedangMemuat } = useAuth()

  if (sedangMemuat) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0E1B2C', color: '#7A8DA5' }}>
        Memuat…
      </div>
    )
  }

  if (!session) return <Login />

  if (!profil) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center" style={{ backgroundColor: '#0E1B2C', color: '#FFFFFF' }}>
        <div>
          <p className="mb-4">Akun ini belum tertaut ke data personel manapun.</p>
          <button
            type="button"
            onClick={keluar}
            className="rounded px-4 py-2 text-sm font-semibold"
            style={{ backgroundColor: '#C8A24A', color: '#0E1B2C' }}
          >
            Keluar
          </button>
        </div>
      </div>
    )
  }

  const user = {
    nama: profil.pangkat ? `${profil.pangkat} ${profil.nama}` : profil.nama,
    jabatan: profil.jabatan_struktur,
    peran_sistem: profil.peran_sistem,
    nrp: profil.nrp,
  }

  return (
    <SprinStoreProvider>
      <Routes>
        <Route
          element={
            <Layout user={user} jumlahPersonel={PERSONEL_CONTOH.length} onKeluar={keluar} />
          }
        >
          <Route
            path="/"
            element={user.peran_sistem === 'PERSONEL' ? <PenugasanSaya nrpSaya={user.nrp} /> : <Dashboard />}
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
          <Route path="/manajemen-pengguna" element={<ManajemenPengguna />} />
          <Route path="/log-aktivitas" element={<LogAktivitas />} />
        </Route>
      </Routes>
    </SprinStoreProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
