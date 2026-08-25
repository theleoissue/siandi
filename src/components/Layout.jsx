import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { MENU_BY_ROLE } from '../lib/menu'

export default function Layout({ user, jumlahPersonel, jumlahSprin, viewAsRole, onChangeViewAsRole, onKeluar }) {
  const menu = MENU_BY_ROLE[user.peran_sistem] ?? []

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F4F6F8', color: '#1A2634' }}>
      <Sidebar menu={menu} jumlahPersonel={jumlahPersonel} jumlahSprin={jumlahSprin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          nama={user.nama}
          jabatan={user.jabatan}
          viewAsRole={viewAsRole}
          onChangeViewAsRole={onChangeViewAsRole}
          onKeluar={onKeluar}
        />
        <Outlet />
      </div>
    </div>
  )
}
