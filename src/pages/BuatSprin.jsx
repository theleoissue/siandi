import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconInfo, IconCheck, IconPlus, IconFolderPlus } from '../components/icons'
import { bangunButirUntuk } from '../lib/jenisKegiatanPreset'
import { ambilDaftarJenisKegiatan, ambilPresetJenisKegiatan } from '../lib/jenisKegiatanApi'
import { SATUAN_FUNGSI_OPTIONS } from '../lib/personelContoh'
import { cariPersonelDb } from '../lib/personelApi'
import { useSprinStore } from '../lib/sprinContext'
import { romawiBulan } from '../lib/format'
import { cekBentrok, ambilRiwayatPenugasanNrp } from '../lib/bentrokApi'
import { ambilUsulanNomorAgenda, cariPemakaiNomorAgenda } from '../lib/sprinApi'

function hariIniIso() {
  const d = new Date()
  const bulan = String(d.getMonth() + 1).padStart(2, '0')
  const tanggal = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${bulan}-${tanggal}`
}

// Tahun diambil dari string ISO langsung, bukan new Date(...).getFullYear() --
// "2026-08-12" diparse sebagai tengah malam UTC, jadi getFullYear() bisa
// meleset satu tahun di tanggal 1 Januari untuk zona waktu di belakang UTC.
function tahunDariIso(isoDate) {
  return isoDate?.slice(0, 4) ?? ''
}

const KETERANGAN_NON_KUATPERS = [
  { value: 'BKO', label: 'BKO' },
  { value: 'MUTASI', label: 'Mutasi' },
  { value: 'PENSIUN', label: 'Pensiun' },
  { value: 'LAINNYA', label: 'Lainnya' },
]

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
  const [jenisOptions, setJenisOptions] = useState([
    { nama: 'PENGAMANAN UNJUK RASA', kode: 'PAM.3.2.', rumpun: 'Pengamanan' },
  ])
  const [jenisKegiatan, setJenisKegiatan] = useState('PENGAMANAN UNJUK RASA')
  const [perihal, setPerihal] = useState('')
  const [pertimbangan, setPertimbangan] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [apelDipimpinOleh, setApelDipimpinOleh] = useState('KABAG OPS')
  const [tanggalMulai, setTanggalMulai] = useState(hariIniIso)
  const [tanggalSelesai, setTanggalSelesai] = useState(hariIniIso)
  const [jamApel, setJamApel] = useState('08:00')
  const [dasarHukumRujukan, setDasarHukumRujukan] = useState('')
  const [durasiJam, setDurasiJam] = useState('') // BR-06: durasi manual untuk jenis operasi

  // Preset (kelompok baku, dasar hukum, butir untuk, kode klasifikasi) dimuat
  // dari DB sesuai jenis kegiatan -- tidak lagi hardcode cuma Unjuk Rasa.
  const [preset, setPreset] = useState(null)
  const [memuatPreset, setMemuatPreset] = useState(true)

  useEffect(() => {
    ambilDaftarJenisKegiatan()
      .then((daftar) => {
        if (daftar.length > 0) setJenisOptions(daftar)
      })
      .catch(() => {})
  }, [])
  // BR-01: hasil pemeriksaan nomor agenda ke DB -- null = belum/tidak diperiksa.
  const [nomorAgendaTerpakai, setNomorAgendaTerpakai] = useState(null)
  const [memeriksaNomor, setMemeriksaNomor] = useState(false)

  const tahunSprin = tahunDariIso(tanggalMulai)

  // BR-01: usulkan nomor agenda tertinggi + 1 saat halaman dibuka -- field tetap
  // bisa disunting manual (lihat onChange di bawah), ini cuma nilai awal.
  useEffect(() => {
    if (!tahunSprin) return
    ambilUsulanNomorAgenda(tahunSprin)
      .then((usulan) => setNomorAgenda((sekarang) => (sekarang ? sekarang : String(usulan))))
      .catch(() => {})
  }, [tahunSprin])

  const nomorAgendaValid = /^\d+$/.test(nomorAgenda.trim())

  // BR-01: sistem memeriksa nomor yang diketik supaya tidak menabrak nomor yang
  // sudah dipakai Sprin lain di tahun yang sama.
  useEffect(() => {
    if (!nomorAgendaValid || !tahunSprin) {
      setNomorAgendaTerpakai(null)
      return
    }
    let dibatalkan = false
    setMemeriksaNomor(true)
    const timer = setTimeout(() => {
      cariPemakaiNomorAgenda(Number(nomorAgenda.trim()), tahunSprin)
        .then((pemakai) => {
          if (!dibatalkan) setNomorAgendaTerpakai(pemakai)
        })
        .catch(() => {
          if (!dibatalkan) setNomorAgendaTerpakai(null)
        })
        .finally(() => {
          if (!dibatalkan) setMemeriksaNomor(false)
        })
    }, 400)
    return () => {
      dibatalkan = true
      clearTimeout(timer)
    }
  }, [nomorAgenda, nomorAgendaValid, tahunSprin])

  const [kelompok, setKelompok] = useState([])
  const [kelompokAktifIdx, setKelompokAktifIdx] = useState(0)
  const [pencarianPersonel, setPencarianPersonel] = useState('')
  const [filterSatuanFungsi, setFilterSatuanFungsi] = useState('')
  // BR-07/08/09: peringatan bentrok per NRP yang sudah ditempatkan, dan status
  // konfirmasi "tetap lanjutkan" kalau ada bentrok menonjol (kelompok PELAKSANA).
  const [bentrokPerNrp, setBentrokPerNrp] = useState({})
  const [tampilkanKonfirmasiBentrok, setTampilkanKonfirmasiBentrok] = useState(false)

  // BR-05/BR-15: pencarian personel query langsung ke Supabase (bukan bundel
  // statis) supaya personel status_aktif=false otomatis tersaring dari
  // penempatan Sprin baru, sementara riwayat lama mereka tetap utuh di tempat lain.
  const [hasilPencarian, setHasilPencarian] = useState([])
  const [sedangMencari, setSedangMencari] = useState(false)
  const [formNonKuatpers, setFormNonKuatpers] = useState(null)

  // Muat preset dari DB tiap kali jenis kegiatan berganti, lalu reset susunan
  // kelompok ke kelompok baku jenis itu (struktur satgas beda tiap jenis).
  useEffect(() => {
    let dibatalkan = false
    setMemuatPreset(true)
    ambilPresetJenisKegiatan(jenisKegiatan)
      .then((p) => {
        if (dibatalkan) return
        setPreset(p)
        setKelompok((p?.kelompokBaku ?? []).map((k) => ({ ...k, personel: [] })))
        setKelompokAktifIdx(0)
        setBentrokPerNrp({})
        setTampilkanKonfirmasiBentrok(false)
        setDurasiJam(p?.perkiraanJam != null ? String(p.perkiraanJam) : '')
      })
      .catch(() => {
        if (!dibatalkan) setPreset(null)
      })
      .finally(() => {
        if (!dibatalkan) setMemuatPreset(false)
      })
    return () => {
      dibatalkan = true
    }
  }, [jenisKegiatan])

  useEffect(() => {
    let dibatalkan = false
    setSedangMencari(true)
    const timer = setTimeout(() => {
      cariPersonelDb(pencarianPersonel, filterSatuanFungsi)
        .then((hasil) => {
          if (!dibatalkan) setHasilPencarian(hasil)
        })
        .catch(() => {
          if (!dibatalkan) setHasilPencarian([])
        })
        .finally(() => {
          if (!dibatalkan) setSedangMencari(false)
        })
    }, 300)
    return () => {
      dibatalkan = true
      clearTimeout(timer)
    }
  }, [pencarianPersonel, filterSatuanFungsi])

  const totalPersonel = kelompok.reduce((acc, k) => acc + k.personel.length, 0)
  const kelompokAktif = kelompok[kelompokAktifIdx]
  // BR-05: jalur non-KUATPERS cuma ditawarkan kalau pencarian NRP/nama tidak
  // menemukan hasil sama sekali -- bukan pilihan default.
  const bisaTambahNonKuatpers =
    !sedangMencari && !filterSatuanFungsi && pencarianPersonel.trim().length >= 2 && hasilPencarian.length === 0

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

  // Kunci bentrokPerNrp per (kelompok, nrp) -- bukan cuma nrp -- karena orang yang
  // sama bisa ditempatkan di lebih dari satu kelompok dalam draf yang sama, dengan
  // sifat kelompok berbeda, sehingga hasil cek bentroknya juga bisa berbeda (BR-08).
  function kunciBentrok(idxKelompok, nrp) {
    return `${idxKelompok}:${nrp}`
  }

  function sudahAdaDiKelompok(k, personel) {
    return personel.nrp
      ? k.personel.some((p) => p.nrp === personel.nrp)
      : k.personel.some((p) => p.tempId === personel.tempId)
  }

  async function tambahPersonelKeKelompokAktif(personel) {
    const kelompokTujuan = kelompokAktif
    const idxTujuan = kelompokAktifIdx
    setKelompok((prev) =>
      prev.map((k, i) =>
        i === kelompokAktifIdx && !sudahAdaDiKelompok(k, personel)
          ? { ...k, personel: [...k.personel, { ...personel, jabatanOperasional: k.nama }] }
          : k,
      ),
    )
    setPencarianPersonel('')
    setFormNonKuatpers(null)
    setTampilkanKonfirmasiBentrok(false)
    if (!kelompokTujuan || !personel.nrp) return // BR-07 cuma dicek untuk personel KUATPERS berakun

    try {
      const riwayat = await ambilRiwayatPenugasanNrp(personel.nrp)
      const konflik = cekBentrok(
        {
          tanggalMulai,
          tanggalSelesai,
          jamApel,
          durasiJam: durasiJam ? Number(durasiJam) : (preset?.perkiraanJam ?? undefined),
          sifat: kelompokTujuan.sifat === 'pengendali' ? 'PENGENDALI' : 'PELAKSANA',
        },
        riwayat,
      )
      setBentrokPerNrp((prev) => ({ ...prev, [kunciBentrok(idxTujuan, personel.nrp)]: konflik }))
    } catch {
      // pengecekan bentrok gagal (mis. koneksi) -- tidak menghalangi alur utama,
      // cuma berarti peringatan tidak tampil untuk orang ini.
    }
  }

  // BR-05/BR-13: jalur manual untuk personel di luar KUATPERS -- wajib isi
  // keterangan pemakaian jalur ini (BKO/Mutasi/Pensiun/Lainnya).
  function submitFormNonKuatpers(e) {
    e.preventDefault()
    if (!formNonKuatpers?.nama?.trim() || !formNonKuatpers?.keterangan) return
    tambahPersonelKeKelompokAktif({
      nama: formNonKuatpers.nama.trim(),
      pangkat: formNonKuatpers.pangkat.trim() || null,
      nrp: formNonKuatpers.nrp.trim() || null,
      jabatanStruktur: formNonKuatpers.jabatanAsal.trim() || null,
      nonKuatpers: true,
      keterangan: formNonKuatpers.keterangan,
      tempId: crypto.randomUUID(),
    })
  }

  const konflikMenonjolAktif = useMemo(() => {
    const hasil = []
    kelompok.forEach((k, ki) => {
      for (const p of k.personel) {
        for (const kf of bentrokPerNrp[kunciBentrok(ki, p.nrp)] ?? []) {
          if (kf.menonjol) hasil.push({ nrp: p.nrp, nama: p.nama, ...kf })
        }
      }
    })
    return hasil
  }, [kelompok, bentrokPerNrp])

  const butirUntuk = useMemo(() => {
    if (!preset) return null
    return bangunButirUntuk(preset, { perihal, tanggalMulai, tanggalSelesai, jamApel, apelDipimpinOleh })
  }, [preset, perihal, tanggalMulai, tanggalSelesai, jamApel, apelDipimpinOleh])

  const nomorLengkap = nomorAgendaValid && preset
    ? `SPRIN/${nomorAgenda.trim()}/${romawiBulan(tanggalMulai)}/${preset.kodeKlasifikasi}/${tahunSprin}`
    : null

  const tanggalTerbalik = Boolean(tanggalMulai && tanggalSelesai && tanggalSelesai < tanggalMulai)

  // BR-06: jenis operasi (wajib_isi_durasi_manual) tidak punya durasi baku,
  // jadi durasi wajib diisi manual (angka > 0) sebelum bisa diajukan.
  const durasiManualTerpenuhi =
    !preset?.wajibDurasiManual || (/^\d+$/.test(durasiJam.trim()) && Number(durasiJam) > 0)

  // Draf boleh disimpan tanpa nomor agenda (BR-17) dan tanpa personel -- yang
  // wajib cuma perihal, supaya draf punya identitas yang bisa dikenali kembali.
  const siapSimpanDraf = Boolean(perihal.trim() && preset && !tanggalTerbalik && !nomorAgendaTerpakai)
  const siapDiajukan = Boolean(
    nomorAgendaValid &&
      !nomorAgendaTerpakai &&
      !memeriksaNomor &&
      perihal.trim() &&
      pertimbangan.trim() &&
      lokasi.trim() &&
      totalPersonel > 0 &&
      preset &&
      !tanggalTerbalik &&
      durasiManualTerpenuhi,
  )

  function handleKlikSimpan() {
    if (!siapDiajukan || menyimpan) return
    if (konflikMenonjolAktif.length > 0 && !tampilkanKonfirmasiBentrok) {
      setTampilkanKonfirmasiBentrok(true)
      return
    }
    prosesAjukan('MENUNGGU_PERSETUJUAN')
  }

  async function prosesAjukan(status = 'MENUNGGU_PERSETUJUAN') {
    setMenyimpan(true)
    setPesanError('')
    try {
      const id = await ajukanSprin({
        status,
        nomorAgenda,
        perihal,
        pertimbangan,
        jenisKegiatanNama: preset.nama,
        kodeKlasifikasi: preset.kodeKlasifikasi,
        tanggalMulai,
        tanggalSelesai,
        jamApel,
        durasiJam: durasiJam ? Number(durasiJam) : preset.perkiraanJam ?? null,
        lokasi,
        kelompok,
        butirUntuk,
        dasarHukumBaku: preset.dasarHukumBaku,
        dasarHukumRujukan,
        kodeDasarHukumRujukan: preset.dasarHukumRujukanDiperlukan?.kode,
        konflikBentrok: konflikMenonjolAktif.map((k) => ({
          nrp: k.nrp,
          nama: k.nama,
          sprinBentrok: k.nomorLengkap,
          perihalBentrok: k.perihal,
          tanggal: k.tanggalBentrok,
        })),
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
            {nomorAgenda.trim() !== '' && !nomorAgendaValid && (
              <div className="mt-2 rounded px-3 py-2 text-xs font-semibold" style={{ backgroundColor: '#FDECEA', color: '#B3261E' }}>
                Nomor agenda harus berupa angka.
              </div>
            )}
            {nomorAgendaTerpakai && (
              <div className="mt-2 rounded px-3 py-2 text-xs" style={{ backgroundColor: '#FDECEA', color: '#B3261E' }}>
                <span className="font-semibold">Nomor {nomorAgenda.trim()} sudah dipakai di tahun {tahunSprin}</span> —{' '}
                {nomorAgendaTerpakai.nomorLengkap} ({nomorAgendaTerpakai.perihal}).
                Ganti dengan nomor lain.
              </div>
            )}
            {nomorAgendaValid && !nomorAgendaTerpakai && !memeriksaNomor && (
              <div className="mt-2 rounded px-3 py-2 text-xs" style={{ backgroundColor: '#E8F5EE', color: '#1F7A4D' }}>
                Nomor {nomorAgenda.trim()} belum dipakai di tahun {tahunSprin}.
              </div>
            )}
            <div
              className="mt-2 flex items-start gap-2 rounded px-3 py-2 text-xs"
              style={{ backgroundColor: '#F4F6F8', color: '#67788C' }}
            >
              <IconInfo size={14} className="mt-0.5 shrink-0" />
              <span>
                Nomor agenda berasal dari buku agenda dan dipakai bersama seluruh satuan fungsi, sekitar 240 nomor
                per bulan. Sistem mengusulkan nomor tertinggi + 1 dan memeriksa apakah nomor sudah terpakai — angka
                tetap bisa diganti manual agar cocok dengan buku agenda fisik.
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
                {['Operasi', 'Pengamanan', 'Lainnya'].map((rumpun) => {
                  const dalamRumpun = jenisOptions.filter((o) => o.rumpun === rumpun)
                  if (dalamRumpun.length === 0) return null
                  return (
                    <optgroup key={rumpun} label={rumpun}>
                      {dalamRumpun.map((o) => (
                        <option key={o.nama} value={o.nama}>
                          {o.nama} ({o.kode})
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
              <div className="mt-1.5 text-xs" style={{ color: '#67788C' }}>
                {memuatPreset
                  ? 'Memuat data jenis kegiatan…'
                  : preset
                    ? `Kode ${preset.kodeKlasifikasi} · ${
                        preset.wajibDurasiManual ? 'durasi diisi manual' : `perkiraan ${preset.perkiraanJam} jam`
                      } · ${preset.kelompokBaku.length} kelompok baku · diperiksa bentrok`
                    : 'Data jenis kegiatan ini belum tersedia.'}
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

              {preset?.wajibDurasiManual && (
                <div className="rounded p-3" style={{ backgroundColor: '#FDF6E3', border: '1px solid #E8D9AE' }}>
                  <Field label="Durasi operasi (jam)" required>
                    <input
                      type="number"
                      min="1"
                      placeholder="mis. 240"
                      className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                      style={inputStyle}
                      value={durasiJam}
                      onChange={(e) => setDurasiJam(e.target.value)}
                    />
                  </Field>
                  <div className="mt-1 text-xs" style={{ color: '#8A6100' }}>
                    Jenis operasi ini tidak punya durasi baku (BR-06) — wajib diisi manual sebelum bisa diajukan.
                  </div>
                </div>
              )}

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
                    {(() => {
                      const baku = preset.dasarHukumBaku
                      const rujukan = dasarHukumRujukan.trim() ? [dasarHukumRujukan.trim()] : []
                      // Sama seperti sprinApi.js: butir baku terakhir (Rengiat/Kalender)
                      // tetap paling akhir, rujukan disisipkan sebelum itu.
                      return baku.length === 0 ? rujukan : [...baku.slice(0, -1), ...rujukan, baku[baku.length - 1]]
                    })().map(
                      (teks, i) => (
                        <li key={i} className="flex gap-2">
                          <span style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                            {i + 1}.
                          </span>
                          <span>{teks}</span>
                        </li>
                      ),
                    )}
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
              disabled={!siapDiajukan || menyimpan}
              onClick={handleKlikSimpan}
              className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: '#0E1B2C', color: '#FFFFFF', border: '1px solid #0E1B2C' }}
            >
              <IconCheck size={15} /> {menyimpan ? 'Menyimpan…' : 'Simpan dan ajukan persetujuan'}
            </button>
            <button
              type="button"
              disabled={!siapSimpanDraf || menyimpan}
              onClick={() => prosesAjukan('DRAF')}
              title="Draf bisa disimpan tanpa nomor agenda dan tanpa personel, lalu dilanjutkan nanti."
              className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: '#FFFFFF', color: '#1A2634', border: '1px solid #DDE3EA' }}
            >
              Simpan sebagai draf
            </button>
          </div>
          {tampilkanKonfirmasiBentrok && (
            <div className="rounded p-3 text-xs" style={{ backgroundColor: '#FDECEA', border: '1px solid #B3261E', color: '#7A1913' }}>
              <div className="mb-2 font-semibold">
                Ditemukan {konflikMenonjolAktif.length} peringatan bentrok penugasan:
              </div>
              <ul className="mb-3 space-y-1">
                {konflikMenonjolAktif.map((k, i) => (
                  <li key={i}>
                    {k.nama} ({k.nrp}) juga bertugas di {k.nomorLengkap}
                    {k.tanggalBentrok ? ` pada ${k.tanggalBentrok}` : ''}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={prosesAjukan}
                  disabled={menyimpan}
                  className="rounded px-3 py-1.5 font-semibold disabled:opacity-40"
                  style={{ backgroundColor: '#B3261E', color: '#FFFFFF' }}
                >
                  {menyimpan ? 'Menyimpan…' : 'Tetap lanjutkan'}
                </button>
                <button
                  type="button"
                  onClick={() => setTampilkanKonfirmasiBentrok(false)}
                  className="rounded px-3 py-1.5 font-semibold"
                  style={{ border: '1px solid #DDE3EA', color: '#67788C' }}
                >
                  Batal
                </button>
              </div>
            </div>
          )}
          {pesanError && (
            <p className="text-xs font-semibold" style={{ color: '#B3261E' }}>
              {pesanError}
            </p>
          )}
          {tanggalTerbalik && (
            <p className="text-xs font-semibold" style={{ color: '#B3261E' }}>
              Tanggal selesai lebih awal dari tanggal mulai.
            </p>
          )}
          <p className="text-xs" style={{ color: '#67788C' }}>
            Untuk diajukan: lengkapi nomor agenda yang belum terpakai, perihal, pertimbangan, lokasi, dan tempatkan
            minimal satu personel. Untuk disimpan sebagai draf: cukup perihal.
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
                  {kelompokAktif.personel.map((p) => {
                    const konflik = bentrokPerNrp[kunciBentrok(kelompokAktifIdx, p.nrp)] ?? []
                    const menonjol = konflik.some((k) => k.menonjol)
                    return (
                      <li key={p.nrp ?? p.tempId} className="rounded px-2 py-1" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">
                            {p.pangkat} {p.nama}
                            {p.nonKuatpers && (
                              <span className="ml-1.5 rounded px-1.5 py-0.5" style={{ backgroundColor: '#FDF6E3', color: '#8A6100' }}>
                                Non-KUATPERS
                              </span>
                            )}
                          </span>
                          <span style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                            {p.nrp ?? '—'}
                          </span>
                        </div>
                        {konflik.length > 0 && (
                          <div className="mt-0.5" style={{ color: menonjol ? '#B3261E' : '#67788C' }}>
                            {menonjol ? '⚠ Bentrok: ' : 'Catatan: '}
                            {konflik.map((k) => k.nomorLengkap).join(', ')}
                          </div>
                        )}
                      </li>
                    )
                  })}
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
            {sedangMencari
              ? 'Mencari…'
              : filterSatuanFungsi
                ? `Menampilkan bagian ${filterSatuanFungsi}. Ketik nama/NRP untuk mempersempit.`
                : 'Ketik minimal dua huruf, atau pilih bagian di atas untuk menjelajah.'}{' '}
            Sumber: roster KUATPERS aktif.
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

          {bisaTambahNonKuatpers && !formNonKuatpers && (
            <button
              type="button"
              onClick={() =>
                setFormNonKuatpers({ nama: pencarianPersonel, pangkat: '', nrp: '', jabatanAsal: '', keterangan: '' })
              }
              className="mt-2 w-full rounded px-3 py-2 text-left text-xs font-semibold"
              style={{ border: '1px dashed #DDE3EA', color: '#67788C' }}
            >
              Tidak ketemu di KUATPERS? Tambahkan sebagai personel di luar KUATPERS (BKO/mutasi/pensiun/lainnya)
            </button>
          )}

          {formNonKuatpers && (
            <form onSubmit={submitFormNonKuatpers} className="mt-2 space-y-2 rounded p-3" style={{ backgroundColor: '#F4F6F8' }}>
              <div className="text-xs font-semibold uppercase" style={{ color: '#67788C' }}>
                Personel di luar KUATPERS
              </div>
              <Field label="Nama" required>
                <input
                  className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  value={formNonKuatpers.nama}
                  onChange={(e) => setFormNonKuatpers((f) => ({ ...f, nama: e.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Pangkat">
                  <input
                    className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                    style={inputStyle}
                    value={formNonKuatpers.pangkat}
                    onChange={(e) => setFormNonKuatpers((f) => ({ ...f, pangkat: e.target.value }))}
                  />
                </Field>
                <Field label="NRP (kalau ada)">
                  <input
                    className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                    style={inputStyle}
                    value={formNonKuatpers.nrp}
                    onChange={(e) => setFormNonKuatpers((f) => ({ ...f, nrp: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Jabatan asal">
                <input
                  className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  value={formNonKuatpers.jabatanAsal}
                  onChange={(e) => setFormNonKuatpers((f) => ({ ...f, jabatanAsal: e.target.value }))}
                />
              </Field>
              <Field label="Keterangan" required>
                <select
                  className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                  value={formNonKuatpers.keterangan}
                  onChange={(e) => setFormNonKuatpers((f) => ({ ...f, keterangan: e.target.value }))}
                >
                  <option value="">Pilih keterangan</option>
                  {KETERANGAN_NON_KUATPERS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!formNonKuatpers.nama.trim() || !formNonKuatpers.keterangan}
                  className="rounded px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                  style={{ backgroundColor: '#0E1B2C', color: '#FFFFFF' }}
                >
                  Tambahkan
                </button>
                <button
                  type="button"
                  onClick={() => setFormNonKuatpers(null)}
                  className="rounded px-3 py-1.5 text-xs font-semibold"
                  style={{ border: '1px solid #DDE3EA', color: '#67788C' }}
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
