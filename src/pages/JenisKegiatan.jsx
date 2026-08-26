import { useEffect, useState } from 'react'
import {
  ambilSemuaJenisKelola,
  tambahJenisKegiatan,
  ubahJenisKegiatan,
  hapusJenisKegiatan,
  simpanKelompokBaku,
  simpanUntukBaku,
  simpanDasarBaku,
} from '../lib/kelolaJenisApi'

const inputStyle = { border: '1px solid #DDE3EA', color: '#1A2634', backgroundColor: '#FFFFFF' }
const labelCls = 'mb-1 block text-xs font-semibold uppercase tracking-wide'
const labelSt = { color: '#67788C' }

function tombolStyle(warna = 'navy') {
  if (warna === 'navy') return { backgroundColor: '#0E1B2C', color: '#FFFFFF' }
  if (warna === 'merah') return { backgroundColor: '#B3261E', color: '#FFFFFF' }
  return { border: '1px solid #DDE3EA', color: '#67788C', backgroundColor: '#FFFFFF' }
}

// Editor daftar teks (satu baris = satu butir) untuk dasar hukum & butir untuk.
function EditorTeks({ judul, nilai, onSimpan, catatan }) {
  const [teks, setTeks] = useState(nilai.join('\n'))
  const [menyimpan, setMenyimpan] = useState(false)
  const [pesan, setPesan] = useState('')

  async function simpan() {
    setMenyimpan(true)
    setPesan('')
    try {
      await onSimpan(teks.split('\n').map((t) => t.trim()).filter(Boolean))
      setPesan('Tersimpan.')
    } catch (e) {
      setPesan(e.message)
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <div>
      <label className={labelCls} style={labelSt}>{judul}</label>
      <textarea
        rows={Math.max(3, teks.split('\n').length)}
        className="w-full rounded px-3 py-2 text-xs outline-none focus:ring-2"
        style={{ ...inputStyle, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
      />
      <div className="mt-1 flex items-center gap-2">
        <button type="button" onClick={simpan} disabled={menyimpan} className="rounded px-3 py-1 text-xs font-semibold disabled:opacity-50" style={tombolStyle('navy')}>
          {menyimpan ? 'Menyimpan…' : 'Simpan'}
        </button>
        {catatan && <span className="text-xs" style={{ color: '#67788C' }}>{catatan}</span>}
        {pesan && <span className="text-xs font-medium" style={{ color: pesan === 'Tersimpan.' ? '#1F7A4D' : '#B3261E' }}>{pesan}</span>}
      </div>
    </div>
  )
}

function EditorKelompok({ nilai, onSimpan }) {
  const [rows, setRows] = useState(nilai.length ? nilai : [{ nama: '', sifat: 'pelaksana' }])
  const [menyimpan, setMenyimpan] = useState(false)
  const [pesan, setPesan] = useState('')

  function ubah(i, patch) {
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }
  function hapus(i) {
    setRows((r) => r.filter((_, j) => j !== i))
  }
  async function simpan() {
    setMenyimpan(true)
    setPesan('')
    try {
      await onSimpan(rows.filter((r) => r.nama.trim()))
      setPesan('Tersimpan.')
    } catch (e) {
      setPesan(e.message)
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <div>
      <label className={labelCls} style={labelSt}>Kelompok satgas</label>
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              placeholder="Nama kelompok"
              className="flex-1 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-2"
              style={inputStyle}
              value={row.nama}
              onChange={(e) => ubah(i, { nama: e.target.value })}
            />
            <button
              type="button"
              onClick={() => ubah(i, { sifat: row.sifat === 'pelaksana' ? 'pengendali' : 'pelaksana' })}
              className="rounded px-2 py-1.5 text-xs font-semibold"
              style={row.sifat === 'pengendali' ? { backgroundColor: '#EEF1F5', color: '#67788C', border: '1px solid #DDE3EA' } : { backgroundColor: '#E8F5EE', color: '#1F7A4D', border: '1px solid #CDE9D9' }}
              title="Klik untuk ganti sifat"
            >
              {row.sifat}
            </button>
            <button type="button" onClick={() => hapus(i)} className="rounded px-2 py-1.5 text-xs" style={{ color: '#B3261E', border: '1px solid #DDE3EA' }}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <button type="button" onClick={() => setRows((r) => [...r, { nama: '', sifat: 'pelaksana' }])} className="rounded px-3 py-1 text-xs font-semibold" style={tombolStyle('outline')}>
          + Tambah kelompok
        </button>
        <button type="button" onClick={simpan} disabled={menyimpan} className="rounded px-3 py-1 text-xs font-semibold disabled:opacity-50" style={tombolStyle('navy')}>
          {menyimpan ? 'Menyimpan…' : 'Simpan kelompok'}
        </button>
        {pesan && <span className="text-xs font-medium" style={{ color: pesan === 'Tersimpan.' ? '#1F7A4D' : '#B3261E' }}>{pesan}</span>}
      </div>
    </div>
  )
}

function KartuJenis({ jk, onBerubah }) {
  const [buka, setBuka] = useState(false)
  const [nama, setNama] = useState(jk.nama)
  const [kode, setKode] = useState(jk.kode)
  const [wajibManual, setWajibManual] = useState(jk.wajibDurasiManual)
  const [perkiraanJam, setPerkiraanJam] = useState(jk.perkiraanJam ?? '')
  const [pesan, setPesan] = useState('')

  async function simpanDasarInfo() {
    setPesan('')
    try {
      await ubahJenisKegiatan(jk.id, { nama, kode, perkiraanJam: perkiraanJam ? Number(perkiraanJam) : null, wajibDurasiManual: wajibManual })
      setPesan('Tersimpan.')
      onBerubah()
    } catch (e) {
      setPesan(e.message)
    }
  }

  async function hapus() {
    if (!window.confirm(`Hapus jenis kegiatan "${jk.nama}"?`)) return
    try {
      await hapusJenisKegiatan(jk.id)
      onBerubah()
    } catch (e) {
      setPesan(e.message)
    }
  }

  return (
    <div className="rounded-lg" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
      <button type="button" onClick={() => setBuka((v) => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div>
          <div className="font-medium">{jk.nama}</div>
          <div className="mt-0.5 text-xs" style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
            {jk.kode} · {jk.wajibDurasiManual ? 'durasi manual' : `perkiraan ${jk.perkiraanJam ?? '—'} jam`} · {jk.kelompok.length} kelompok · {jk.dasar.length} dasar · {jk.untuk.length} butir
          </div>
        </div>
        <span style={{ color: '#67788C' }}>{buka ? '▲' : '▼'}</span>
      </button>

      {buka && (
        <div className="space-y-4 border-t px-4 py-4" style={{ borderColor: '#DDE3EA' }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls} style={labelSt}>Nama</label>
              <input className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2" style={inputStyle} value={nama} onChange={(e) => setNama(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} style={labelSt}>Kode klasifikasi (KKA)</label>
              <input className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2" style={{ ...inputStyle, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }} value={kode} onChange={(e) => setKode(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs" style={{ color: '#1A2634' }}>
              <input type="checkbox" checked={wajibManual} onChange={(e) => setWajibManual(e.target.checked)} />
              Durasi diisi manual (jenis operasi)
            </label>
            {!wajibManual && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#67788C' }}>Perkiraan durasi (jam):</span>
                <input type="number" min="1" className="w-24 rounded px-2 py-1 text-sm outline-none focus:ring-2" style={inputStyle} value={perkiraanJam} onChange={(e) => setPerkiraanJam(e.target.value)} />
              </div>
            )}
            <button type="button" onClick={simpanDasarInfo} className="rounded px-3 py-1.5 text-xs font-semibold" style={tombolStyle('navy')}>Simpan info</button>
            {pesan && <span className="text-xs font-medium" style={{ color: pesan === 'Tersimpan.' ? '#1F7A4D' : '#B3261E' }}>{pesan}</span>}
          </div>

          <EditorKelompok nilai={jk.kelompok} onSimpan={(d) => simpanKelompokBaku(jk.id, d).then(onBerubah)} />
          <EditorTeks judul="Dasar hukum baku (satu per baris)" nilai={jk.dasar} onSimpan={(d) => simpanDasarBaku(jk.id, d).then(onBerubah)} catatan="Yang generik saja; rujukan spesifik diketik per-Sprin." />
          <EditorTeks judul="Butir Untuk baku (ekor — satu per baris)" nilai={jk.untuk} onSimpan={(d) => simpanUntukBaku(jk.id, d).then(onBerubah)} catatan="Butir 1-2 (perihal & waktu) disusun otomatis, tak perlu ditulis." />

          <div className="border-t pt-3" style={{ borderColor: '#DDE3EA' }}>
            <button type="button" onClick={hapus} className="rounded px-3 py-1.5 text-xs font-semibold" style={tombolStyle('merah')}>Hapus jenis kegiatan</button>
          </div>
        </div>
      )}
    </div>
  )
}

function FormTambah({ onSelesai }) {
  const [buka, setBuka] = useState(false)
  const [nama, setNama] = useState('')
  const [kode, setKode] = useState('')
  const [wajibManual, setWajibManual] = useState(false)
  const [perkiraanJam, setPerkiraanJam] = useState('8')
  const [pesan, setPesan] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)

  async function simpan() {
    if (!nama.trim() || !kode.trim()) {
      setPesan('Nama dan kode wajib diisi.')
      return
    }
    setMenyimpan(true)
    setPesan('')
    try {
      await tambahJenisKegiatan({ nama, kode, perkiraanJam: perkiraanJam ? Number(perkiraanJam) : null, wajibDurasiManual: wajibManual })
      setNama('')
      setKode('')
      setBuka(false)
      onSelesai()
    } catch (e) {
      setPesan(e.message)
    } finally {
      setMenyimpan(false)
    }
  }

  if (!buka) {
    return (
      <button type="button" onClick={() => setBuka(true)} className="rounded px-4 py-2 text-sm font-semibold" style={tombolStyle('navy')}>
        + Tambah jenis kegiatan
      </button>
    )
  }

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #C8A24A' }}>
      <div className="mb-3 text-sm font-semibold" style={{ color: '#0E1B2C' }}>Jenis kegiatan baru</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls} style={labelSt}>Nama</label>
          <input placeholder="mis. OPERASI LILIN" className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2" style={inputStyle} value={nama} onChange={(e) => setNama(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} style={labelSt}>Kode klasifikasi (KKA)</label>
          <input placeholder="mis. OPS.1.2.4." className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2" style={{ ...inputStyle, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }} value={kode} onChange={(e) => setKode(e.target.value)} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs" style={{ color: '#1A2634' }}>
          <input type="checkbox" checked={wajibManual} onChange={(e) => setWajibManual(e.target.checked)} />
          Durasi diisi manual (jenis operasi)
        </label>
        {!wajibManual && (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#67788C' }}>Perkiraan durasi (jam):</span>
            <input type="number" min="1" className="w-24 rounded px-2 py-1 text-sm outline-none focus:ring-2" style={inputStyle} value={perkiraanJam} onChange={(e) => setPerkiraanJam(e.target.value)} />
          </div>
        )}
      </div>
      <div className="mt-1 text-xs" style={{ color: '#67788C' }}>
        Cukup nama + kode agar penomoran langsung jalan. Kelompok satgas, dasar hukum, dan butir untuk bisa dilengkapi setelah dibuat.
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={simpan} disabled={menyimpan} className="rounded px-4 py-2 text-sm font-semibold disabled:opacity-50" style={tombolStyle('navy')}>
          {menyimpan ? 'Menyimpan…' : 'Buat'}
        </button>
        <button type="button" onClick={() => setBuka(false)} className="rounded px-4 py-2 text-sm font-semibold" style={tombolStyle('outline')}>Batal</button>
        {pesan && <span className="text-xs font-medium" style={{ color: '#B3261E' }}>{pesan}</span>}
      </div>
    </div>
  )
}

export default function JenisKegiatan() {
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [error, setError] = useState('')

  async function muat() {
    setMemuat(true)
    setError('')
    try {
      setDaftar(await ambilSemuaJenisKelola())
    } catch (e) {
      setError(e.message)
    } finally {
      setMemuat(false)
    }
  }

  useEffect(() => {
    muat()
  }, [])

  const grup = [
    { rumpun: 'Operasi', isi: daftar.filter((d) => d.rumpun === 'Operasi') },
    { rumpun: 'Pengamanan', isi: daftar.filter((d) => d.rumpun === 'Pengamanan') },
    { rumpun: 'Lainnya', isi: daftar.filter((d) => d.rumpun === 'Lainnya') },
  ]

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
            Kelola Jenis Kegiatan
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
            Susunan baku yang mengisi surat otomatis. Tambah jenis dengan kode KKA; penomoran langsung jalan.
          </p>
        </div>
        <FormTambah onSelesai={muat} />
      </div>

      {memuat && <p className="text-sm" style={{ color: '#67788C' }}>Memuat…</p>}
      {error && <p className="text-sm font-semibold" style={{ color: '#B3261E' }}>{error}</p>}

      {!memuat &&
        grup.map((g) =>
          g.isi.length === 0 ? null : (
            <div key={g.rumpun} className="mb-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: '#67788C' }}>
                {g.rumpun}
              </div>
              <div className="space-y-2">
                {g.isi.map((jk) => (
                  <KartuJenis key={jk.id} jk={jk} onBerubah={muat} />
                ))}
              </div>
            </div>
          ),
        )}
    </main>
  )
}
