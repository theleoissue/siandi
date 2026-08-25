import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cariPersonelContoh } from '../lib/personelContoh'
import { useSprinStore, STATUS_BADGE_STYLE } from '../lib/sprinContext'

const inputStyle = {
  border: '1px solid #DDE3EA',
  color: '#1A2634',
  backgroundColor: '#FFFFFF',
}

export default function RiwayatPenugasan() {
  const { riwayatUntuk } = useSprinStore()
  const navigate = useNavigate()
  const [kataKunci, setKataKunci] = useState('')
  const [terpilih, setTerpilih] = useState(null)

  const hasilPencarian = useMemo(() => (terpilih ? [] : cariPersonelContoh(kataKunci)), [kataKunci, terpilih])
  const riwayat = useMemo(() => (terpilih ? riwayatUntuk(terpilih.nrp) : []), [terpilih, riwayatUntuk])

  function pilihPersonel(p) {
    setTerpilih(p)
    setKataKunci('')
  }

  function ubahKataKunci(v) {
    setKataKunci(v)
    setTerpilih(null)
  }

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Riwayat Penugasan
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Rekam jejak penugasan per personel untuk bahan analisis dan evaluasi pimpinan.
        </p>
      </div>

      <div className="rounded-lg mb-4 p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#67788C' }}>
          Cari personel
        </label>
        <div className="max-w-md">
          <input
            placeholder="Ketik nama atau NRP"
            className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
            style={inputStyle}
            value={kataKunci}
            onChange={(e) => ubahKataKunci(e.target.value)}
          />
        </div>

        {hasilPencarian.length > 0 && (
          <div className="mt-2 max-w-md space-y-1">
            {hasilPencarian.map((p) => (
              <button
                key={p.nrp}
                type="button"
                onClick={() => pilihPersonel(p)}
                className="block w-full rounded px-2.5 py-1.5 text-left text-xs"
                style={{ border: '1px solid #DDE3EA' }}
              >
                <span className="font-medium">{p.pangkat} {p.nama}</span>{' '}
                <span style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                  · {p.nrp}
                </span>
              </button>
            ))}
          </div>
        )}

        {terpilih && (
          <>
            <div className="mt-3 flex flex-wrap gap-6 text-xs" style={{ color: '#67788C' }}>
              <span>
                Terpilih <b style={{ color: '#1A2634' }}>{terpilih.pangkat} {terpilih.nama}</b>
              </span>
              <span>
                NRP{' '}
                <b style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color: '#1A2634' }}>
                  {terpilih.nrp}
                </b>
              </span>
              <span>
                Jabatan <b style={{ color: '#1A2634' }}>{terpilih.jabatanStruktur}</b>
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-6 text-xs" style={{ color: '#67788C' }}>
              <span>
                Jumlah Sprin <b style={{ color: '#1A2634' }}>{riwayat.length}</b>
              </span>
              <span>
                Jumlah baris penugasan <b style={{ color: '#1A2634' }}>{riwayat.length}</b>
              </span>
            </div>
          </>
        )}
      </div>

      {terpilih ? (
        riwayat.length === 0 ? (
          <div
            className="rounded-lg p-8 text-center text-sm"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA', color: '#67788C' }}
          >
            Belum ada riwayat penugasan yang tercatat untuk personel ini.
          </div>
        ) : (
          <div className="space-y-2">
            {riwayat.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigate(`/sprin/${r.sprinId}`)}
                className="block w-full rounded-lg p-4 text-left"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{r.perihal}</div>
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
                <div className="mt-1 text-xs" style={{ color: '#67788C' }}>
                  {r.waktuLabel}
                </div>
                <div className="mt-1 text-xs">{r.jabatanLabel}</div>
              </button>
            ))}
          </div>
        )
      ) : (
        <div
          className="rounded-lg p-8 text-center text-sm"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA', color: '#67788C' }}
        >
          Ketik nama atau NRP untuk mencari personel.
        </div>
      )}
    </main>
  )
}
