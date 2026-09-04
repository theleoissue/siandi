import { IconLogOut, IconMenu } from './icons'

export default function Topbar({ nama, jabatan, onKeluar, onBukaMenu }) {
  return (
    <header
      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
      style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #DDE3EA' }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBukaMenu}
          className="rounded p-1.5 md:hidden"
          style={{ border: '1px solid #DDE3EA', color: '#0E1B2C' }}
          aria-label="Buka menu"
        >
          <IconMenu size={18} />
        </button>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold" style={{ color: '#0E1B2C' }}>
            {nama}
          </div>
          <div className="truncate text-xs" style={{ color: '#67788C' }}>
            {jabatan}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onKeluar}
          className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs"
          style={{ border: '1px solid #DDE3EA', color: '#67788C' }}
        >
          <IconLogOut size={13} />
          Keluar
        </button>
      </div>
    </header>
  )
}
