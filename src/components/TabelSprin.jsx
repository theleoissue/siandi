import { useNavigate } from 'react-router-dom'
import { STATUS_BADGE_STYLE } from '../lib/sprinContext'

export default function TabelSprin({ daftar, pesanKosong }) {
  const navigate = useNavigate()

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#F4F6F8' }}>
              {['Nomor', 'Perihal', 'Waktu', 'Personel', 'Status', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: '#67788C' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daftar.map((s) => (
              <tr key={s.id} style={{ borderTop: '1px solid #DDE3EA' }}>
                <td
                  className="px-4 py-3 align-top text-xs"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color: '#67788C' }}
                >
                  {s.nomorLengkap}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="max-w-xs font-medium">{s.perihal}</div>
                  <div className="text-xs" style={{ color: '#67788C' }}>
                    {s.jenisKegiatanNama}
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-xs">{s.waktuLabel}</td>
                <td
                  className="px-4 py-3 align-top text-xs"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                >
                  {s.jumlahPersonel}
                  <div style={{ color: '#67788C' }}>{s.jumlahKelompok} kel.</div>
                </td>
                <td className="px-4 py-3 align-top">
                  <span
                    className="inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold"
                    style={STATUS_BADGE_STYLE[s.status]}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <button
                    type="button"
                    onClick={() => navigate(`/sprin/${s.id}`)}
                    className="text-xs font-semibold"
                    style={{ color: '#0E1B2C' }}
                  >
                    Buka
                  </button>
                </td>
              </tr>
            ))}
            {daftar.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-xs" style={{ color: '#67788C' }}>
                  {pesanKosong}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
