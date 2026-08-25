import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IconCheck } from '../components/icons'
import { useSprinStore, STATUS_BADGE_STYLE } from '../lib/sprinContext'

function IconX(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 15}
      height={props.size ?? 15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

export default function SprinDetail({ peranSaya }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cariSprin, setujuiSprin, kembalikanSprin } = useSprinStore()
  const [tab, setTab] = useState('isi')
  const [catatan, setCatatan] = useState('')

  const sprin = cariSprin(id)
  if (!sprin) {
    return (
      <main className="flex-1 overflow-y-auto p-5">
        <div className="rounded-lg p-8 text-center text-sm" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA', color: '#67788C' }}>
          Sprin tidak ditemukan.
        </div>
      </main>
    )
  }

  const bisaMemutuskan = peranSaya === 'KABAG_OPS' && sprin.status === 'Menunggu Persetujuan'

  function handleSetujui() {
    setujuiSprin(sprin.id, catatan)
  }

  function handleKembalikan() {
    if (!catatan.trim()) return
    kembalikanSprin(sprin.id, catatan)
  }

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 text-sm font-semibold"
        style={{ color: '#67788C' }}
      >
        ← Kembali
      </button>

      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
        <div className="px-6 py-5" style={{ backgroundColor: '#0E1B2C' }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest" style={{ color: '#E8D9AE' }}>
                Surat Perintah
              </div>
              <div className="mt-1 text-lg" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#FFFFFF' }}>
                {sprin.perihal}
              </div>
              <div
                className="mt-1.5 text-xs"
                style={{ color: '#8FA3BB', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
              >
                {sprin.nomorLengkap}
              </div>
            </div>
            <span
              className="inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold"
              style={STATUS_BADGE_STYLE[sprin.status]}
            >
              {sprin.status}
            </span>
          </div>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          <button
            type="button"
            onClick={() => setTab('isi')}
            className="rounded-t px-3 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: tab === 'isi' ? '#F4F6F8' : 'transparent',
              color: tab === 'isi' ? '#0E1B2C' : '#67788C',
              borderBottom: tab === 'isi' ? '2px solid #C8A24A' : '2px solid transparent',
            }}
          >
            Isi surat
          </button>
          <button
            type="button"
            onClick={() => setTab('lampiran')}
            className="rounded-t px-3 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: tab === 'lampiran' ? '#F4F6F8' : 'transparent',
              color: tab === 'lampiran' ? '#0E1B2C' : '#67788C',
              borderBottom: tab === 'lampiran' ? '2px solid #C8A24A' : '2px solid transparent',
            }}
          >
            Lampiran ({sprin.jumlahPersonel} personel)
          </button>
        </div>

        {tab === 'isi' ? (
          sprin.detailLengkap ? (
            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="space-y-3 text-sm">
                <MetaItem label="Jenis kegiatan" value={sprin.jenisKegiatanNama} />
                <MetaItem label="Kode klasifikasi" value={sprin.kodeKlasifikasi} />
                <MetaItem label="Waktu" value={sprin.waktuPanjang} />
                <MetaItem label="Apel" value={sprin.apelLabel} />
                <MetaItem label="Penandatangan" value={sprin.penandatangan} />
                <MetaItem label="Pertimbangan" value={sprin.pertimbangan} />
              </div>
              <div className="space-y-4">
                <DaftarButir judul="Dasar" butir={sprin.dasar} />
                <DaftarButir judul="Untuk" butir={sprin.untuk} />
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm" style={{ color: '#67788C' }}>
              Detail lengkap (pertimbangan, dasar, untuk) untuk Sprin arsip ini menyusul di tahap sambungkan data
              asli — belum diambil dari sumber.
            </div>
          )
        ) : (
          <div className="p-6">
            {sprin.kelompok ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: '#F4F6F8' }}>
                      {['No', 'No', 'Nama', 'Pangkat', 'NRP / NIP', 'Jabatan Struktur', 'Jabatan Operasional'].map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-semibold uppercase tracking-wide" style={{ color: '#67788C' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sprin.kelompok.flatMap((k, kIdx) => {
                      let nomorKeseluruhan = sprin.kelompok
                        .slice(0, kIdx)
                        .reduce((acc, kk) => acc + kk.personel.length, 0)
                      return k.personel.map((p, pIdx) => {
                        nomorKeseluruhan += 1
                        return (
                          <tr key={`${kIdx}-${pIdx}`} style={{ borderTop: '1px solid #DDE3EA' }}>
                            <td className="px-3 py-1.5" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color: '#67788C' }}>
                              {nomorKeseluruhan}
                            </td>
                            <td className="px-3 py-1.5" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color: '#67788C' }}>
                              {pIdx + 1}
                            </td>
                            <td className="px-3 py-1.5 font-medium">{p.nama}</td>
                            <td className="px-3 py-1.5">{p.pangkat}</td>
                            <td className="px-3 py-1.5" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color: '#67788C' }}>
                              {p.nrp}
                            </td>
                            <td className="px-3 py-1.5">{p.jabatanStruktur}</td>
                            <td className="px-3 py-1.5 font-semibold">{k.nama}</td>
                          </tr>
                        )
                      })
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm" style={{ color: '#67788C' }}>
                Daftar personel untuk Sprin arsip ini menyusul di tahap sambungkan data asli.
              </div>
            )}
          </div>
        )}

        {bisaMemutuskan && (
          <div className="px-6 pb-6">
            <div className="rounded p-4" style={{ backgroundColor: '#F4F6F8', border: '1px solid #DDE3EA' }}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#67788C' }}>
                Catatan pemeriksaan (opsional)
              </label>
              <input
                placeholder="Contoh: personel Sat Lantas ditambah dua orang"
                className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                style={{ border: '1px solid #DDE3EA', color: '#1A2634', backgroundColor: '#FFFFFF' }}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSetujui}
                  className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: '#C8A24A', color: '#0E1B2C', border: '1px solid #C8A24A' }}
                >
                  <IconCheck size={15} /> Setujui dan terbitkan
                </button>
                <button
                  type="button"
                  onClick={handleKembalikan}
                  disabled={!catatan.trim()}
                  title={!catatan.trim() ? 'Catatan pemeriksaan wajib diisi saat mengembalikan (BR-11)' : undefined}
                  className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: '#B3261E', color: '#FFFFFF', border: '1px solid #B3261E' }}
                >
                  <IconX size={15} /> Kembalikan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function MetaItem({ label, value }) {
  if (!value) return null
  return (
    <div>
      <div className="text-xs uppercase tracking-wide" style={{ color: '#67788C' }}>
        {label}
      </div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  )
}

function DaftarButir({ judul, butir }) {
  if (!butir?.length) return null
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase" style={{ color: '#67788C' }}>
        {judul}
      </div>
      <ol className="space-y-1 text-xs">
        {butir.map((teks, i) => (
          <li key={i} className="flex gap-2">
            <span style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
              {i + 1}.
            </span>
            <span>{teks}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
