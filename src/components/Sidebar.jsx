import { NavLink } from 'react-router-dom'
import {
  IconShield,
  IconLayoutDashboard,
  IconFilePlusCorner,
  IconFiles,
  IconSearch,
  IconRotateCcwClock,
  IconBell,
  IconSquareCheckBig,
  IconScrollText,
  IconUsers,
  IconLayers,
  IconUserCog,
  IconX,
} from './icons'

const ICON_BY_KEY = {
  dashboard: IconLayoutDashboard,
  'buat-sprin': IconFilePlusCorner,
  'daftar-sprin': IconFiles,
  arsip: IconSearch,
  riwayat: IconRotateCcwClock,
  notifikasi: IconBell,
  persetujuan: IconSquareCheckBig,
  'log-aktivitas': IconScrollText,
  'data-personel': IconUsers,
  'jenis-kegiatan': IconLayers,
  'manajemen-pengguna': IconUserCog,
  'penugasan-saya': IconRotateCcwClock,
}

// terbuka/onTutup cuma berlaku di layar <md (drawer geser dari kiri + latar
// gelap) -- di md ke atas sidebar selalu tampil statis seperti biasa, dua
// prop itu diabaikan.
export default function Sidebar({ menu, jumlahPersonel, jumlahSprin, terbuka, onTutup }) {
  return (
    <>
      {terbuka && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: 'rgba(14,27,44,0.6)' }}
          onClick={onTutup}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col transition-transform duration-200 md:static md:z-auto md:flex md:translate-x-0 ${
          terbuka ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#0E1B2C' }}
      >
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: '1px solid #2C3F58' }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ border: '1.5px solid #C8A24A' }}
          >
            <IconShield size={17} color="#C8A24A" />
          </div>
          <div className="flex-1">
            <div
              className="text-lg leading-none tracking-widest"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#FFFFFF' }}
            >
              SIANDI
            </div>
            <div className="mt-1 text-xs" style={{ color: '#7A8DA5' }}>
              Polres Cimahi
            </div>
          </div>
          <button
            type="button"
            onClick={onTutup}
            className="rounded p-1.5 md:hidden"
            style={{ color: '#A9BACE' }}
            aria-label="Tutup menu"
          >
            <IconX size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {menu.map((item) => {
            const IconComp = ICON_BY_KEY[item.key]
            return (
              <NavLink
                key={item.key}
                to={item.path}
                end={item.path === '/'}
                onClick={onTutup}
                className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm"
                style={({ isActive }) => ({
                  color: isActive ? '#FFFFFF' : '#A9BACE',
                  backgroundColor: isActive ? '#1B2C42' : 'transparent',
                  borderLeft: isActive ? '3px solid #C8A24A' : '3px solid transparent',
                })}
              >
                <IconComp size={16} />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="px-5 py-4 text-xs" style={{ borderTop: '1px solid #2C3F58', color: '#7A8DA5' }}>
          {jumlahPersonel} personel · {jumlahSprin} Sprin nyata
        </div>
      </aside>
    </>
  )
}
