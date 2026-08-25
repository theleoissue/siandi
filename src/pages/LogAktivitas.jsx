import { useSprinStore } from '../lib/sprinContext'

export default function LogAktivitas() {
  const { logAktivitas } = useSprinStore()

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Log Aktivitas
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Jejak tindakan pengguna, termasuk bentrok yang tetap diteruskan.
        </p>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
        {logAktivitas.map((l, i) => (
          <div key={l.id} className="flex gap-3 px-4 py-3" style={{ borderTop: i === 0 ? 'none' : '1px solid #DDE3EA' }}>
            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: l.warna }} />
            <div className="min-w-0 flex-1">
              <div className="text-sm" style={{ color: '#1A2634' }}>
                {l.aksi}
              </div>
              <div className="mt-0.5 text-xs" style={{ color: '#67788C' }}>
                {l.pelaku} ·{' '}
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                  {l.waktuLabel}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
