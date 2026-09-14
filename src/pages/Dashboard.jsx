import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconChevronRight } from '../components/icons'
import { useSprinStore, STATUS_BADGE_STYLE } from '../lib/sprinContext'
import { ambilTotalPersonelAktif } from '../lib/personelApi'

const TANGGAL_HARI_INI = new Date().toLocaleDateString('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

// Top-N personel yang paling sering jadi pelaksana (bukan pimpinan/pengendali)
// di Sprin yang sudah Terbit -- pengganti live untuk daftar dummy lama.
function hitungBebanPenugasan(daftar, maks = 7) {
  const hitung = new Map()
  for (const s of daftar) {
    if (s.status !== 'Terbit') continue
    for (const k of s.kelompok) {
      if (k.sifat === 'pengendali') continue
      for (const p of k.personel) {
        const kunci = p.nrp || p.nama
        const label = `${p.pangkat ? `${p.pangkat} ` : ''}${p.nama}`
        const entri = hitung.get(kunci) ?? { nama: label, jumlah: 0 }
        entri.jumlah += 1
        hitung.set(kunci, entri)
      }
    }
  }
  return [...hitung.values()].sort((a, b) => b.jumlah - a.jumlah).slice(0, maks)
}

export default function Dashboard() {
  const { daftar } = useSprinStore()
  const navigate = useNavigate()
  const [totalPersonel, setTotalPersonel] = useState(null)

  useEffect(() => {
    ambilTotalPersonelAktif().then(setTotalPersonel).catch(() => {})
  }, [])

  const statCards = useMemo(() => {
    const terbit = daftar.filter((s) => s.status === 'Terbit').length
    const menunggu = daftar.filter((s) => s.status === 'Menunggu Persetujuan').length
    return [
      { label: 'Sprin terbit', value: String(terbit), color: '#1F7A4D' },
      { label: 'Menunggu persetujuan', value: String(menunggu), color: '#8A6100' },
      {
        label: 'Personel terdata',
        value: totalPersonel === null ? '…' : totalPersonel.toLocaleString('id-ID'),
        color: '#0E1B2C',
      },
    ]
  }, [daftar, totalPersonel])

  const sprinTerbaru = daftar.slice(0, 6)
  const bebanPenugasan = useMemo(() => hitungBebanPenugasan(daftar), [daftar])
  const maksBeban = Math.max(1, ...bebanPenugasan.map((b) => b.jumlah))

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Rekapitulasi surat perintah dan sebaran penugasan · {TANGGAL_HARI_INI}
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-lg p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
            <div className="text-3xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: s.color }}>
              {s.value}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wide" style={{ color: '#67788C' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-lg p-4 lg:col-span-2" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
          <div className="mb-3 text-sm font-semibold" style={{ color: '#0E1B2C' }}>
            Surat perintah terbaru
          </div>
          <div className="space-y-2">
            {sprinTerbaru.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => navigate(`/sprin/${s.id}`)}
                className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left hover:opacity-80"
                style={{ border: '1px solid #DDE3EA' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.perihal}</div>
                  <div
                    className="mt-0.5 truncate text-xs"
                    style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                  >
                    {s.nomorLengkap} · {s.jumlahPersonel} personel · {s.jumlahKelompok} kelompok
                  </div>
                </div>
                <span
                  className="inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold"
                  style={STATUS_BADGE_STYLE[s.status]}
                >
                  {s.status}
                </span>
                <IconChevronRight size={15} color="#67788C" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
          <div className="mb-1 text-sm font-semibold" style={{ color: '#0E1B2C' }}>
            Personel paling sering ditugaskan
          </div>
          <div className="mb-3 text-xs" style={{ color: '#67788C' }}>
            Hanya kelompok pelaksana (di luar pimpinan/pengendali), Sprin Terbit
          </div>
          {bebanPenugasan.length === 0 ? (
            <p className="text-xs" style={{ color: '#67788C' }}>
              Belum ada data penugasan.
            </p>
          ) : (
            <div className="space-y-2.5">
              {bebanPenugasan.map((b) => (
                <div key={b.nama}>
                  <div className="mb-1 flex justify-between gap-2 text-xs">
                    <span className="truncate">{b.nama}</span>
                    <span style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                      {b.jumlah}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: '#EEF1F5' }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${(b.jumlah / maksBeban) * 100}%`, backgroundColor: '#C8A24A' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
