import { useEffect, useState } from 'react'
import { IconSearch, IconPlus, IconX } from '../components/icons'
import { SATUAN_FUNGSI_OPTIONS } from '../lib/personelContoh'
import { ambilDaftarPersonel, ambilDaftarNonKuatpers, tambahPersonelNonKuatpers } from '../lib/personelApi'

const UKURAN_HALAMAN_OPTIONS = [10, 25, 50, 100]

const KETERANGAN_NON_KUATPERS = [
  { value: 'BKO', label: 'BKO' },
  { value: 'MUTASI', label: 'Mutasi' },
  { value: 'PENSIUN', label: 'Pensiun' },
  { value: 'LAINNYA', label: 'Lainnya' },
]
const LABEL_KETERANGAN = Object.fromEntries(KETERANGAN_NON_KUATPERS.map((k) => [k.value, k.label]))

const inputStyle = { border: '1px solid #DDE3EA', color: '#1A2634', backgroundColor: '#FFFFFF' }

function useDebounced(nilai, jeda = 350) {
  const [tertunda, setTertunda] = useState(nilai)
  useEffect(() => {
    const t = setTimeout(() => setTertunda(nilai), jeda)
    return () => clearTimeout(t)
  }, [nilai, jeda])
  return tertunda
}

function Paginasi({ halaman, ukuranHalaman, total, onHalaman, onUkuranHalaman }) {
  const totalHalaman = Math.max(1, Math.ceil(total / ukuranHalaman))
  const dari = total === 0 ? 0 : halaman * ukuranHalaman + 1
  const sampai = Math.min(total, (halaman + 1) * ukuranHalaman)

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: '#67788C' }}>
      <div className="flex items-center gap-2">
        <span>Tampilkan</span>
        <select
          className="rounded px-2 py-1 text-xs outline-none focus:ring-2"
          style={inputStyle}
          value={ukuranHalaman}
          onChange={(e) => onUkuranHalaman(Number(e.target.value))}
        >
          {UKURAN_HALAMAN_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>baris per halaman</span>
      </div>
      <div className="flex items-center gap-3">
        <span>
          {total === 0 ? 'Tidak ada data' : `Menampilkan ${dari}–${sampai} dari ${total.toLocaleString('id-ID')}`}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={halaman === 0}
            onClick={() => onHalaman(halaman - 1)}
            className="rounded px-2 py-1 font-semibold disabled:opacity-40"
            style={inputStyle}
          >
            Sebelumnya
          </button>
          <span>
            Hal. {halaman + 1} / {totalHalaman}
          </span>
          <button
            type="button"
            disabled={halaman + 1 >= totalHalaman}
            onClick={() => onHalaman(halaman + 1)}
            className="rounded px-2 py-1 font-semibold disabled:opacity-40"
            style={inputStyle}
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  )
}

function FormTambahNonKuatpers({ penggunaIdSaya, onBatal, onSukses }) {
  const [form, setForm] = useState({ nama: '', nrp: '', pangkat: '', jabatanAsal: '', keterangan: '', catatan: '' })
  const [menyimpan, setMenyimpan] = useState(false)
  const [error, setError] = useState(null)

  const bisaSimpan = form.nama.trim() && form.keterangan

  async function submit() {
    if (!bisaSimpan) return
    setMenyimpan(true)
    setError(null)
    try {
      await tambahPersonelNonKuatpers({ ...form, diinputOleh: penggunaIdSaya })
      onSukses()
    } catch (e) {
      setError(e.message)
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <div className="mb-4 rounded-lg p-4" style={{ backgroundColor: '#F9FAFB', border: '1px solid #DDE3EA' }}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: '#0E1B2C' }}>
          Tambah Personel Non-KUATPERS
        </h2>
        <button type="button" onClick={onBatal} aria-label="Tutup">
          <IconX size={16} color="#67788C" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          placeholder="Nama *"
          className="rounded px-3 py-2 text-sm outline-none focus:ring-2"
          style={inputStyle}
          value={form.nama}
          onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
        />
        <input
          placeholder="NRP (opsional)"
          className="rounded px-3 py-2 text-sm outline-none focus:ring-2"
          style={inputStyle}
          value={form.nrp}
          onChange={(e) => setForm((f) => ({ ...f, nrp: e.target.value }))}
        />
        <input
          placeholder="Pangkat"
          className="rounded px-3 py-2 text-sm outline-none focus:ring-2"
          style={inputStyle}
          value={form.pangkat}
          onChange={(e) => setForm((f) => ({ ...f, pangkat: e.target.value }))}
        />
        <input
          placeholder="Jabatan asal"
          className="rounded px-3 py-2 text-sm outline-none focus:ring-2"
          style={inputStyle}
          value={form.jabatanAsal}
          onChange={(e) => setForm((f) => ({ ...f, jabatanAsal: e.target.value }))}
        />
        <select
          className="rounded px-3 py-2 text-sm outline-none focus:ring-2"
          style={inputStyle}
          value={form.keterangan}
          onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
        >
          <option value="">Keterangan *</option>
          {KETERANGAN_NON_KUATPERS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <input
          placeholder="Catatan"
          className="rounded px-3 py-2 text-sm outline-none focus:ring-2"
          style={inputStyle}
          value={form.catatan}
          onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
        />
      </div>
      {error && (
        <p className="mt-2 text-xs" style={{ color: '#B4232C' }}>
          Gagal menyimpan: {error}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={!bisaSimpan || menyimpan}
          onClick={submit}
          className="rounded px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#0E1B2C' }}
        >
          {menyimpan ? 'Menyimpan…' : 'Simpan personel'}
        </button>
        <button type="button" onClick={onBatal} className="text-xs font-semibold" style={{ color: '#67788C' }}>
          Batal
        </button>
      </div>
    </div>
  )
}

export default function DataPersonel({ peranSaya, penggunaIdSaya }) {
  const [tab, setTab] = useState('kuatpers')
  const [kataKunci, setKataKunci] = useState('')
  const kataKunciTertunda = useDebounced(kataKunci)
  const [satuanFungsi, setSatuanFungsi] = useState('')
  const [halaman, setHalaman] = useState(0)
  const [ukuranHalaman, setUkuranHalaman] = useState(25)

  const [baris, setBaris] = useState([])
  const [total, setTotal] = useState(0)
  const [memuat, setMemuat] = useState(true)
  const [error, setError] = useState(null)
  const [tampilkanForm, setTampilkanForm] = useState(false)

  // Ganti pencarian/filter/tab -> kembali ke halaman pertama supaya tidak
  // "nyangkut" di halaman yang jadi kosong setelah hasil menyempit.
  useEffect(() => {
    setHalaman(0)
  }, [tab, kataKunciTertunda, satuanFungsi, ukuranHalaman])

  async function muatUlang() {
    setMemuat(true)
    setError(null)
    try {
      const hasil =
        tab === 'kuatpers'
          ? await ambilDaftarPersonel({ kataKunci: kataKunciTertunda, satuanFungsi, halaman, ukuranHalaman })
          : await ambilDaftarNonKuatpers({ kataKunci: kataKunciTertunda, halaman, ukuranHalaman })
      setBaris(hasil.baris)
      setTotal(hasil.total)
    } catch (e) {
      setError(e.message)
    } finally {
      setMemuat(false)
    }
  }

  useEffect(() => {
    muatUlang()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, kataKunciTertunda, satuanFungsi, halaman, ukuranHalaman])

  const bisaTambah = ['KASUBBAG_BINOPS', 'PAURMIN'].includes(peranSaya)

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
            Data Personel
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
            Roster KUATPERS dan personel di luar KUATPERS (BKO/mutasi/pensiun/lainnya), langsung dari database.
          </p>
        </div>
        {tab === 'non-kuatpers' && bisaTambah && !tampilkanForm && (
          <button
            type="button"
            onClick={() => setTampilkanForm(true)}
            className="flex items-center gap-1.5 rounded px-3 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: '#0E1B2C' }}
          >
            <IconPlus size={13} /> Tambah Personel
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-1 rounded-lg p-1" style={{ backgroundColor: '#F4F6F8', width: 'fit-content' }}>
        {[
          { key: 'kuatpers', label: 'Roster KUATPERS' },
          { key: 'non-kuatpers', label: 'Non-KUATPERS' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key)
              setTampilkanForm(false)
            }}
            className="rounded px-3 py-1.5 text-xs font-semibold"
            style={
              tab === t.key
                ? { backgroundColor: '#0E1B2C', color: '#FFFFFF' }
                : { color: '#67788C', backgroundColor: 'transparent' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'non-kuatpers' && bisaTambah && tampilkanForm && (
        <FormTambahNonKuatpers
          penggunaIdSaya={penggunaIdSaya}
          onBatal={() => setTampilkanForm(false)}
          onSukses={() => {
            setTampilkanForm(false)
            muatUlang()
          }}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative max-w-md flex-1" style={{ minWidth: 240 }}>
          <IconSearch
            size={14}
            color="#67788C"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            placeholder={tab === 'kuatpers' ? 'Cari nama, NRP, atau jabatan' : 'Cari nama, NRP, atau jabatan asal'}
            className="w-full rounded py-2 pl-8 pr-3 text-sm outline-none focus:ring-2"
            style={inputStyle}
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
          />
        </div>
        {tab === 'kuatpers' && (
          <select
            className="rounded px-3 py-2 text-sm outline-none focus:ring-2"
            style={inputStyle}
            value={satuanFungsi}
            onChange={(e) => setSatuanFungsi(e.target.value)}
          >
            <option value="">Semua satuan fungsi</option>
            {SATUAN_FUNGSI_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F4F6F8' }}>
                {(tab === 'kuatpers'
                  ? ['Pangkat', 'Nama', 'NRP', 'Jabatan Struktur', 'Satuan Fungsi', 'Status']
                  : ['Pangkat', 'Nama', 'NRP', 'Jabatan Asal', 'Keterangan', 'Catatan']
                ).map((h) => (
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
              {tab === 'kuatpers'
                ? baris.map((p) => (
                    <tr key={p.id} style={{ borderTop: '1px solid #DDE3EA' }}>
                      <td className="px-4 py-2 text-xs">{p.pangkat}</td>
                      <td className="px-4 py-2 text-sm font-medium">{p.nama}</td>
                      <td
                        className="px-4 py-2 text-xs"
                        style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                      >
                        {p.nrp}
                      </td>
                      <td className="px-4 py-2 text-xs">{p.jabatan_struktur}</td>
                      <td className="px-4 py-2 text-xs">{p.satuan_fungsi}</td>
                      <td className="px-4 py-2 text-xs">
                        <span
                          className="rounded px-2 py-0.5 text-xs font-semibold"
                          style={
                            p.status_aktif
                              ? { backgroundColor: '#E8F5EE', color: '#1F7A4D' }
                              : { backgroundColor: '#EEF1F5', color: '#67788C' }
                          }
                        >
                          {p.status_aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                    </tr>
                  ))
                : baris.map((p) => (
                    <tr key={p.id} style={{ borderTop: '1px solid #DDE3EA' }}>
                      <td className="px-4 py-2 text-xs">{p.pangkat}</td>
                      <td className="px-4 py-2 text-sm font-medium">{p.nama}</td>
                      <td
                        className="px-4 py-2 text-xs"
                        style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                      >
                        {p.nrp}
                      </td>
                      <td className="px-4 py-2 text-xs">{p.jabatan_asal}</td>
                      <td className="px-4 py-2 text-xs">
                        <span
                          className="rounded px-2 py-0.5 text-xs font-semibold"
                          style={{ backgroundColor: '#FBF1DC', color: '#8A6416' }}
                        >
                          {LABEL_KETERANGAN[p.keterangan] ?? p.keterangan}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs" style={{ color: '#67788C' }}>
                        {p.catatan}
                      </td>
                    </tr>
                  ))}
              {!memuat && baris.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs" style={{ color: '#67788C' }}>
                    Tidak ada personel yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {memuat && (
        <p className="mt-2 text-xs" style={{ color: '#67788C' }}>
          Memuat…
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs" style={{ color: '#B4232C' }}>
          Gagal memuat: {error}
        </p>
      )}

      <Paginasi
        halaman={halaman}
        ukuranHalaman={ukuranHalaman}
        total={total}
        onHalaman={setHalaman}
        onUkuranHalaman={setUkuranHalaman}
      />
    </main>
  )
}
