import { useMemo, useState } from 'react'
import { DAFTAR_SPRIN_CONTOH, STATUS_BADGE_STYLE } from '../lib/daftarSprinContoh'

const TABS = ['Semua', 'Menunggu', 'Terbit', 'Dikembalikan']

export default function DaftarSprin() {
  const [tabAktif, setTabAktif] = useState('Semua')

  const daftar = useMemo(() => {
    if (tabAktif === 'Semua') return DAFTAR_SPRIN_CONTOH
    return DAFTAR_SPRIN_CONTOH.filter((s) => s.status === tabAktif)
  }, [tabAktif])

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Daftar Surat Perintah
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Seluruh Sprin yang tercatat di Bag Ops Polres Cimahi.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((tab) => {
          const aktif = tab === tabAktif
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setTabAktif(tab)}
              className="rounded px-3 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: aktif ? '#0E1B2C' : '#FFFFFF',
                color: aktif ? '#FFFFFF' : '#67788C',
                border: aktif ? '1px solid #0E1B2C' : '1px solid #DDE3EA',
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

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
                <tr key={s.nomor} style={{ borderTop: '1px solid #DDE3EA' }}>
                  <td
                    className="px-4 py-3 align-top text-xs"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color: '#67788C' }}
                  >
                    {s.nomor}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="max-w-xs font-medium">{s.perihal}</div>
                    <div className="text-xs" style={{ color: '#67788C' }}>
                      {s.jenis}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-xs">{s.waktu}</td>
                  <td
                    className="px-4 py-3 align-top text-xs"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                  >
                    {s.personel}
                    <div style={{ color: '#67788C' }}>{s.kelompok} kel.</div>
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
                    <button type="button" className="text-xs font-semibold" style={{ color: '#0E1B2C' }}>
                      Buka
                    </button>
                  </td>
                </tr>
              ))}
              {daftar.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs" style={{ color: '#67788C' }}>
                    Tidak ada Sprin dengan status ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
