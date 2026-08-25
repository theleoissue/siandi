import { useMemo, useState } from 'react'
import TabelSprin from '../components/TabelSprin'
import { JENIS_KEGIATAN_OPTIONS } from '../lib/jenisKegiatanPreset'
import { useSprinStore } from '../lib/sprinContext'

const inputStyle = {
  border: '1px solid #DDE3EA',
  color: '#1A2634',
  backgroundColor: '#FFFFFF',
}

export default function Arsip() {
  const { daftar } = useSprinStore()
  const [kataKunci, setKataKunci] = useState('')
  const [jenisKegiatan, setJenisKegiatan] = useState('')
  const [dari, setDari] = useState('')
  const [sampai, setSampai] = useState('')

  const hasil = useMemo(() => {
    const kunci = kataKunci.trim().toLowerCase()
    return daftar.filter((s) => {
      if (s.status !== 'Terbit') return false
      if (jenisKegiatan && s.jenisKegiatanNama !== jenisKegiatan) return false
      if (dari && s.tanggalMulai && s.tanggalMulai < dari) return false
      if (sampai && s.tanggalSelesai && s.tanggalSelesai > sampai) return false
      if (kunci) {
        const cocokDasar =
          s.nomorLengkap.toLowerCase().includes(kunci) || s.perihal.toLowerCase().includes(kunci)
        const cocokPersonel = (s.kelompok ?? []).some((k) =>
          k.personel.some((p) => p.nama.toLowerCase().includes(kunci) || (p.nrp ?? '').includes(kunci)),
        )
        if (!cocokDasar && !cocokPersonel) return false
      }
      return true
    })
  }, [daftar, kataKunci, jenisKegiatan, dari, sampai])

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Arsip & Pencarian
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Menelusuri surat perintah yang sudah diterbitkan, termasuk berdasarkan nama personel.
        </p>
      </div>

      <div className="rounded-lg mb-4 p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#67788C' }}>
              Kata kunci
            </label>
            <input
              placeholder="Nomor, perihal, nama personel, atau NRP"
              className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
              style={inputStyle}
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#67788C' }}>
              Jenis kegiatan
            </label>
            <select
              className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
              style={inputStyle}
              value={jenisKegiatan}
              onChange={(e) => setJenisKegiatan(e.target.value)}
            >
              <option value="">Semua jenis</option>
              {JENIS_KEGIATAN_OPTIONS.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#67788C' }}>
                Dari
              </label>
              <input
                type="date"
                className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                style={inputStyle}
                value={dari}
                onChange={(e) => setDari(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#67788C' }}>
                Sampai
              </label>
              <input
                type="date"
                className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                style={inputStyle}
                value={sampai}
                onChange={(e) => setSampai(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs" style={{ color: '#67788C' }}>
          {hasil.length} surat perintah ditemukan.
        </div>
      </div>

      <TabelSprin daftar={hasil} pesanKosong="Tidak ada Sprin yang cocok dengan pencarian." />
    </main>
  )
}
