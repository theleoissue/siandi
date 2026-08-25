import { useNavigate } from 'react-router-dom'
import { IconBell } from '../components/icons'
import { useSprinStore } from '../lib/SprinStore'

export default function Notifikasi({ nrpSaya }) {
  const { notifikasiUntuk, tandaiNotifikasiDibaca } = useSprinStore()
  const navigate = useNavigate()
  const daftar = notifikasiUntuk(nrpSaya)

  function handleKlik(n) {
    tandaiNotifikasiDibaca(n.id)
    navigate(`/sprin/${n.sprinId}`)
  }

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Notifikasi
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Pemberitahuan yang dikirimkan sistem kepada personel.
        </p>
      </div>

      {daftar.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center text-sm"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA', color: '#67788C' }}
        >
          Belum ada notifikasi. Setujui sebuah Sprin untuk melihat pemberitahuan terkirim.
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
          {daftar.map((n, i) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleKlik(n)}
              className="flex w-full gap-3 px-4 py-3 text-left"
              style={{
                borderTop: i === 0 ? 'none' : '1px solid #DDE3EA',
                backgroundColor: n.dibaca ? '#FFFFFF' : '#FDF6E3',
              }}
            >
              <IconBell size={15} color={n.dibaca ? '#67788C' : '#8A6100'} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{n.perihal}</div>
                <div className="mt-0.5 text-xs" style={{ color: '#67788C' }}>
                  {n.subjudul}
                </div>
                <div
                  className="mt-1 truncate text-xs"
                  style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                >
                  {n.nomorLengkap} · untuk {n.nrp}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}
