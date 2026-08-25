import { useNavigate } from 'react-router-dom'
import { IconClock, IconLayers } from '../components/icons'
import { useSprinStore, STATUS_BADGE_STYLE } from '../lib/sprinContext'

export default function PenugasanSaya({ nrpSaya }) {
  const { riwayatUntuk } = useSprinStore()
  const navigate = useNavigate()
  const penugasan = riwayatUntuk(nrpSaya)

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Penugasan Saya
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Surat perintah yang mencantumkan nama Anda.
        </p>
      </div>

      {penugasan.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center text-sm"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA', color: '#67788C' }}
        >
          Belum ada Sprin yang mencantumkan nama Anda.
        </div>
      ) : (
        <div className="space-y-3">
          {penugasan.map((r, i) => (
            <div
              key={i}
              className="rounded-lg p-4"
              style={{ backgroundColor: '#FFFFFF', borderWidth: '1px 1px 1px 3px', borderStyle: 'solid', borderColor: '#DDE3EA #DDE3EA #DDE3EA #C8A24A' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium">{r.perihal}</div>
                  <div
                    className="mt-0.5 text-xs"
                    style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                  >
                    {r.nomorLengkap}
                  </div>
                </div>
                <span
                  className="inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold"
                  style={STATUS_BADGE_STYLE[r.status]}
                >
                  {r.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs" style={{ color: '#67788C' }}>
                <span className="flex items-center gap-1">
                  <IconClock size={12} /> {r.waktuLabel}
                </span>
                <span className="flex items-center gap-1">
                  <IconLayers size={12} /> {r.jabatanLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/sprin/${r.sprinId}`)}
                className="mt-3 text-xs font-semibold"
                style={{ color: '#0E1B2C' }}
              >
                Lihat rincian
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
