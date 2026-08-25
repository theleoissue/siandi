import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconInfo, IconCheck, IconPlus, IconFolderPlus } from '../components/icons'
import { JENIS_KEGIATAN_OPTIONS, PRESET_UNJUK_RASA, bangunButirUntuk } from '../lib/jenisKegiatanPreset'
import { cariPersonelContoh, PERSONEL_CONTOH, SATUAN_FUNGSI_OPTIONS } from '../lib/personelContoh'
import { useSprinStore } from '../lib/sprinContext'
import { romawiBulan } from '../lib/format'

const inputStyle = {
  border: '1px solid #DDE3EA',
  color: '#1A2634',
  backgroundColor: '#FFFFFF',
}
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide'
const labelStyle = { color: '#67788C' }

function Field({ label, required, children }) {
  return (
    <div>
      <label className={labelClass} style={labelStyle}>
        {label} {required && <span style={{ color: '#B3261E' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function BuatSprin() {
  const navigate = useNavigate()
  const { ajukanSprin } = useSprinStore()
  const [menyimpan, setMenyimpan] = useState(false)
  const [pesanError, setPesanError] = useState('')

  const [nomorAgenda, setNomorAgenda] = useState('')
  const [jenisKegiatan, setJenisKegiatan] = useState('PENGAMANAN UNJUK RASA')
  const [perihal, setPerihal] = useState('')
  const [pertimbangan, setPertimbangan] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [apelDipimpinOleh, setApelDipimpinOleh] = useState('KABAG OPS')
  const [tanggalMulai, setTanggalMulai] = useState('2026-08-12')
  const [tanggalSelesai, setTanggalSelesai] = useState('2026-08-12')
  const [jamApel, setJamApel] = useState('08:00')
  const [dasarHukumRujukan, setDasarHukumRujukan] = useState('')

  const isPresetTersedia = jenisKegiatan === 'PENGAMANAN UNJUK RASA'
  const preset = isPresetTersedia ? PRESET_UNJUK_RASA : null

  const [kelompok, setKelompok] = useState(() =>
    PRESET_UNJUK_RASA.kelompokBaku.map((k) => ({ ...k, personel: [] })),
  )
  const [kelompokAktifIdx, setKelompokAktifIdx] = useState(0)
  const [pencarianPersonel, setPencarianPersonel] = useState('')
  const [filterSatuanFungsi, setFilterSatuanFungsi] = useState('')

  const totalPersonel = kelompok.reduce((acc, k) => acc + k.personel.length, 0)
  const kelompokAktif = kelompok[kelompokAktifIdx]
  const hasilPencarian = useMemo(
    () => cariPersonelContoh(pencarianPersonel, filterSatuanFungsi),
    [pencarianPersonel, filterSatuanFungsi],
  )

  function tambahKelompok(sifat) {
    const nama = sifat === 'pengendali' ? 'KELOMPOK BARU' : `TIM ${kelompok.length + 1}`
    setKelompok((prev) => [...prev, { nama, sifat, personel: [] }])
    setKelompokAktifIdx(kelompok.length)
  }

  function ubahNamaKelompokAktif(nama) {
    setKelompok((prev) => prev.map((k, i) => (i === kelompokAktifIdx ? { ...k, nama } : k)))
  }

  function ubahSifatKelompokAktif(sifat) {
    setKelompok((prev) => prev.map((k, i) => (i === kelompokAktifIdx ? { ...k, sifat } : k)))
  }

  function ubahKelompokBesarAktif(kelompokBesar) {
    setKelompok((prev) => prev.map((k, i) => (i === kelompokAktifIdx ? { ...k, kelompokBesar } : k)))
  }

  function tambahPersonelKeKelompokAktif(personel) {
    setKelompok((prev) =>
      prev.map((k, i) =>
        i === kelompokAktifIdx && !k.personel.some((p) => p.nrp === personel.nrp)
          ? { ...k, personel: [...k.personel, { ...personel, jabatanOperasional: k.nama }] }
          : k,
      ),
    )
    setPencarianPersonel('')
  }

  const butirUntuk = useMemo(() => {
    if (!preset) return null
    return bangunButirUntuk(preset, { tanggalMulai, jamApel, apelDipimpinOleh })
  }, [preset, tanggalMulai, jamApel, apelDipimpinOleh])

  const nomorLengkap = nomorAgenda && preset
    ? `SPRIN/${nomorAgenda}/${romawiBulan(tanggalMulai)}/${preset.kodeKlasifikasi}/${new Date(tanggalMulai).getFullYear()}`
    : null

  const siapDisimpan = Boolean(nomorAgenda && perihal && pertimbangan && lokasi && totalPersonel > 0 && preset)

  async function handleAjukan() {
    if (!siapDisimpan || menyimpan) return
    setMenyimpan(true)
    setPesanError('')
    try {
      const id = await ajukanSprin({
        nomorAgenda,
        perihal,
        pertimbangan,
        jenisKegiatanNama: preset.nama,
        kodeKlasifikasi: preset.kodeKlasifikasi,
        tanggalMulai,
        tanggalSelesai,
        jamApel,
        lokasi,
        kelompok,
      })
      navigate(`/sprin/${id}`)
    } catch (err) {
      setPesanError(err.message ?? 'Gagal menyimpan Sprin.')
      setMenyimpan(false)
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Buat Surat Perintah
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Susunan kelompok, dasar hukum, dan butir perintah terisi dari jenis kegiatan.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Kartu 1: Nomor dan jenis kegiatan */}
          <div className="rounded-lg p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
            <div className="mb-4 text-sm font-semibold" style={{ color: '#0E1B2C' }}>
              Nomor dan jenis kegiatan
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Nomor agenda" required>
                <input
                  placeholder="1703"
                  className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ ...inputStyle, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                  value={nomorAgenda}
                  onChange={(e) => setNomorAgenda(e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <label className={labelClass} style={labelStyle}>
                  Nomor lengkap terbentuk
                </label>
                <div
                  className="rounded px-3 py-2 text-sm"
                  style={{
                    backgroundColor: '#F4F6F8',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                    color: '#67788C',
                    border: '1px solid #DDE3EA',
                  }}
                >
                  {nomorLengkap ?? 'menunggu nomor agenda'}
                </div>
              </div>
            </div>
            <div
              className="mt-2 flex items-start gap-2 rounded px-3 py-2 text-xs"
              style={{ backgroundColor: '#F4F6F8', color: '#67788C' }}
            >
              <IconInfo size={14} className="mt-0.5 shrink-0" />
              <span>
                Nomor agenda berasal dari buku agenda dan dipakai bersama seluruh satuan fungsi, sekitar 240 nomor
                per bulan. Sistem tidak mengusulkan nomor, hanya memeriksa.
              </span>
            </div>
            <div className="mt-4">
              <label className={labelClass} style={labelStyle}>
                Jenis kegiatan <span style={{ color: '#B3261E' }}>*</span>
              </label>
              <select
                className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                style={inputStyle}
                value={jenisKegiatan}
                onChange={(e) => setJenisKegiatan(e.target.value)}
              >
                {JENIS_KEGIATAN_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
              <div className="mt-1.5 text-xs" style={{ color: '#67788C' }}>
                {preset
                  ? `Kode ${preset.kodeKlasifikasi} · perkiraan ${preset.perkiraanJam} jam · diperiksa bentrok · disusun dari ${preset.sumberContoh} contoh`
                  : 'Data kelompok & dasar hukum untuk jenis ini menyusul di tahap sambungkan data asli.'}
              </div>
            </div>
          </div>

          {/* Kartu 2: Keterangan kegiatan */}
          <div className="rounded-lg p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
            <div className="mb-4 text-sm font-semibold" style={{ color: '#0E1B2C' }}>
              Keterangan kegiatan
            </div>
            <div className="space-y-4">
              <Field label="Perihal" required>
                <input
                  placeholder="Pengamanan unjuk rasa di Kantor Pemkot Cimahi"
                  className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                />
              </Field>
              <Field label="Pertimbangan" required>
                <textarea
                  rows={2}
                  placeholder="bahwa dalam rangka ..., maka dipandang perlu mengeluarkan surat perintah ini."
                  className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  value={pertimbangan}
                  onChange={(e) => setPertimbangan(e.target.value)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Lokasi" required>
                  <input
                    className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                    style={inputStyle}
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                  />
                </Field>
                <Field label="Apel dipimpin oleh">
                  <input
                    className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                    style={inputStyle}
                    value={apelDipimpinOleh}
                    onChange={(e) => setApelDipimpinOleh(e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Tanggal mulai" required>
                  <input
                    type="date"
                    className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                    style={inputStyle}
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                  />
                </Field>
                <Field label="Tanggal selesai" required>
                  <input
                    type="date"
                    className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                    style={inputStyle}
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                  />
                </Field>
                <Field label="Jam apel">
                  <input
                    type="time"
                    className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                    style={inputStyle}
                    value={jamApel}
                    onChange={(e) => setJamApel(e.target.value)}
                  />
                </Field>
              </div>

              {preset?.dasarHukumRujukanDiperlukan && (
                <div className="space-y-3" style={{ borderTop: '1px solid #DDE3EA', paddingTop: 14 }}>
                  <div className="text-xs font-semibold uppercase" style={{ color: '#67788C' }}>
                    Dasar hukum yang perlu diisi
                  </div>
                  <Field
                    label={`${preset.dasarHukumRujukanDiperlukan.kode} · ${preset.dasarHukumRujukanDiperlukan.keterangan}`}
                  >
                    <input
                      placeholder={preset.dasarHukumRujukanDiperlukan.placeholder}
                      className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                      style={inputStyle}
                      value={dasarHukumRujukan}
                      onChange={(e) => setDasarHukumRujukan(e.target.value)}
                    />
                  </Field>
                  <div className="text-xs" style={{ color: '#67788C' }}>
                    Kosongkan bila tidak dipakai; butir yang kosong tidak ikut tercetak.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kartu 3: Pratinjau isi surat */}
          {preset && (
            <div className="rounded-lg p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
              <div className="mb-1 text-sm font-semibold" style={{ color: '#0E1B2C' }}>
                Pratinjau isi surat
              </div>
              <div className="mb-3 text-xs" style={{ color: '#67788C' }}>
                Terbentuk dari jenis kegiatan dan isian di atas.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase" style={{ color: '#67788C' }}>
                    Dasar
                  </div>
                  <ol className="space-y-1 text-xs">
                    {preset.dasarHukumBaku.map((teks, i) => (
                      <li key={i} className="flex gap-2">
                        <span style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                          {i + 1}.
                        </span>
                        <span>{teks}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase" style={{ color: '#67788C' }}>
                    Untuk
                  </div>
                  <ol className="space-y-1 text-xs">
                    {butirUntuk.map((teks, i) => (
                      <li key={i} className="flex gap-2">
                        <span style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                          {i + 1}.
                        </span>
                        <span>{teks}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!siapDisimpan || menyimpan}
              onClick={handleAjukan}
              className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: '#0E1B2C', color: '#FFFFFF', border: '1px solid #0E1B2C' }}
            >
              <IconCheck size={15} /> {menyimpan ? 'Menyimpan…' : 'Simpan dan ajukan persetujuan'}
            </button>
            <button
              type="button"
              disabled={!siapDisimpan || menyimpan}
              className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: '#FFFFFF', color: '#1A2634', border: '1px solid #DDE3EA' }}
            >
              Simpan sebagai draf
            </button>
          </div>
          {pesanError && (
            <p className="text-xs font-semibold" style={{ color: '#B3261E' }}>
              {pesanError}
            </p>
          )}
          <p className="text-xs" style={{ color: '#67788C' }}>
            Lengkapi nomor agenda yang belum terpakai, perihal, pertimbangan, lokasi, dan tempatkan minimal satu
            personel.
          </p>
        </div>

        {/* Panel kelompok satgas */}
        <div className="rounded-lg h-fit p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
          <div className="mb-1 text-sm font-semibold" style={{ color: '#0E1B2C' }}>
            Kelompok satgas
          </div>
          <div className="mb-3 text-xs" style={{ color: '#67788C' }}>
            {totalPersonel} personel ditempatkan · {kelompok.length} kelompok
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => tambahKelompok('pelaksana')}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold"
              style={{ border: '1px solid #DDE3EA', color: '#67788C' }}
            >
              <IconPlus size={12} /> Tim
            </button>
            <button
              type="button"
              onClick={() => tambahKelompok('pengendali')}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold"
              style={{ border: '1px solid #DDE3EA', color: '#67788C' }}
            >
              <IconFolderPlus size={12} /> Kelompok besar
            </button>
          </div>
          <div className="mb-3 max-h-40 space-y-1 overflow-y-auto">
            {kelompok.map((k, i) => {
              const aktif = i === kelompokAktifIdx
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setKelompokAktifIdx(i)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs"
                  style={{
                    backgroundColor: aktif ? '#0E1B2C' : '#FFFFFF',
                    color: aktif ? '#FFFFFF' : '#1A2634',
                    border: aktif ? '1px solid #0E1B2C' : '1px solid #DDE3EA',
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{k.nama}</div>
                  </div>
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', opacity: 0.7 }}>
                    {k.personel.length}
                  </span>
                </button>
              )
            })}
          </div>

          {kelompokAktif && (
            <div className="mb-3 space-y-2 rounded p-3" style={{ backgroundColor: '#F4F6F8' }}>
              <Field label="Kelompok besar (opsional)">
                <input
                  placeholder="mis. PAM OBJEK GEDUNG SATE"
                  className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  value={kelompokAktif.kelompokBesar ?? ''}
                  onChange={(e) => ubahKelompokBesarAktif(e.target.value)}
                />
              </Field>
              <Field label="Nama tim">
                <input
                  className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  value={kelompokAktif.nama}
                  onChange={(e) => ubahNamaKelompokAktif(e.target.value)}
                />
              </Field>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => ubahSifatKelompokAktif('pelaksana')}
                  className="flex-1 rounded px-2 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: kelompokAktif.sifat === 'pelaksana' ? '#67788C' : '#FFFFFF',
                    color: kelompokAktif.sifat === 'pelaksana' ? '#FFFFFF' : '#67788C',
                    border: '1px solid #DDE3EA',
                  }}
                >
                  pelaksana
                </button>
                <button
                  type="button"
                  onClick={() => ubahSifatKelompokAktif('pengendali')}
                  className="flex-1 rounded px-2 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: kelompokAktif.sifat === 'pengendali' ? '#67788C' : '#FFFFFF',
                    color: kelompokAktif.sifat === 'pengendali' ? '#FFFFFF' : '#67788C',
                    border: '1px solid #DDE3EA',
                  }}
                >
                  pengendali
                </button>
              </div>
              {kelompokAktif.personel.length > 0 && (
                <ul className="space-y-1 pt-1 text-xs">
                  {kelompokAktif.personel.map((p) => (
                    <li key={p.nrp} className="flex items-center justify-between gap-2 rounded px-2 py-1" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
                      <span className="truncate">{p.pangkat} {p.nama}</span>
                      <span style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                        {p.nrp}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <select
            className="mb-2 w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
            style={inputStyle}
            value={filterSatuanFungsi}
            onChange={(e) => setFilterSatuanFungsi(e.target.value)}
          >
            <option value="">Semua bagian</option>
            {SATUAN_FUNGSI_OPTIONS.map((sf) => (
              <option key={sf} value={sf}>
                {sf}
              </option>
            ))}
          </select>
          <input
            placeholder={`Cari personel untuk ${kelompokAktif?.nama ?? ''}`}
            className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
            style={inputStyle}
            value={pencarianPersonel}
            onChange={(e) => setPencarianPersonel(e.target.value)}
          />
          <div className="mt-2 text-xs" style={{ color: '#67788C' }}>
            {filterSatuanFungsi
              ? `Menampilkan bagian ${filterSatuanFungsi}. Ketik nama/NRP untuk mempersempit.`
              : 'Ketik minimal dua huruf, atau pilih bagian di atas untuk menjelajah.'}{' '}
            Sumber: {PERSONEL_CONTOH.length.toLocaleString('id-ID')} personel KUATPERS.
          </div>
          <div className="mt-2 max-h-44 space-y-1 overflow-y-auto text-xs">
            {hasilPencarian.map((p) => (
              <button
                key={p.nrp}
                type="button"
                onClick={() => tambahPersonelKeKelompokAktif(p)}
                className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left hover:opacity-70"
                style={{ border: '1px solid #DDE3EA' }}
              >
                <IconPlus size={13} className="shrink-0" color="#67788C" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.pangkat} {p.nama}</div>
                  <div className="truncate" style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                    {p.nrp} · {p.jabatanStruktur}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
