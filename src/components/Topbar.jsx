import { IconLogOut } from './icons'

const ROLE_OPTIONS = [
  { value: 'pimpinan', label: 'Pimpinan' },
  { value: 'kabagops', label: 'Kabag Ops' },
  { value: 'binops', label: 'Bin Ops' },
  { value: 'admin', label: 'Paurmin' },
  { value: 'personel', label: 'Personel' },
]

export default function Topbar({ nama, jabatan, viewAsRole, onChangeViewAsRole, onKeluar }) {
  return (
    <header
      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
      style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #DDE3EA' }}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold" style={{ color: '#0E1B2C' }}>
          {nama}
        </div>
        <div className="truncate text-xs" style={{ color: '#67788C' }}>
          {jabatan}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden text-xs sm:block" style={{ color: '#67788C' }}>
          Lihat sebagai
        </div>
        <select
          className="rounded px-2 py-1.5 text-xs outline-none"
          style={{ border: '1px solid #C8A24A', color: '#0E1B2C', backgroundColor: '#FDF6E3' }}
          value={viewAsRole}
          onChange={(e) => onChangeViewAsRole(e.target.value)}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
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
