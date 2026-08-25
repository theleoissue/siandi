import { useCallback, useEffect, useState } from 'react'
import { SprinContext } from './sprinContext'
import {
  ambilDaftarSprin,
  ambilLogAktivitas,
  ambilNotifikasi,
  ajukanSprinDb,
  setujuiSprinDb,
  kembalikanSprinDb,
  tandaiNotifikasiDibacaDb,
  tetapkanPenandatanganDb,
} from './sprinApi'

export function SprinStoreProvider({ children }) {
  const [daftar, setDaftar] = useState([])
  const [notifikasi, setNotifikasi] = useState([])
  const [logAktivitas, setLogAktivitas] = useState([])
  // Pemuatan pertama belum selesai -> daftar masih kosong. Tanpa penanda ini
  // halaman detail tidak bisa membedakan "Sprin memang tidak ada" dari
  // "datanya belum sampai", dan terlanjur bilang tidak ditemukan.
  const [belumPernahDimuat, setBelumPernahDimuat] = useState(true)

  const muatUlang = useCallback(async () => {
    try {
      const [daftarBaru, logBaru, notifBaru] = await Promise.all([
        ambilDaftarSprin(),
        ambilLogAktivitas(),
        ambilNotifikasi(),
      ])
      setDaftar(daftarBaru)
      setLogAktivitas(logBaru)
      setNotifikasi(notifBaru)
    } finally {
      setBelumPernahDimuat(false)
    }
  }, [])

  useEffect(() => {
    muatUlang()
  }, [muatUlang])

  async function ajukanSprin(data) {
    const id = await ajukanSprinDb(data)
    await muatUlang()
    return id
  }

  async function setujuiSprin(id, catatanPemeriksaan) {
    await setujuiSprinDb(id, catatanPemeriksaan)
    await muatUlang()
  }

  async function kembalikanSprin(id, catatanPemeriksaan) {
    await kembalikanSprinDb(id, catatanPemeriksaan)
    await muatUlang()
  }

  async function tetapkanPenandatangan(id, penandatanganId) {
    await tetapkanPenandatanganDb(id, penandatanganId)
    await muatUlang()
  }

  function cariSprin(id) {
    return daftar.find((s) => s.id === id) ?? null
  }

  // Baris notifikasi milik pengguna lain sudah tersaring oleh RLS saat pengambilan
  // data -- parameter nrp di sini cuma dipakai untuk menyusun ulang teks subjudul
  // ("<kelompok> sebagai <jabatan>. Apel <jam> WIB.") dari data kelompok/personel
  // yang sudah dimuat, karena tabel notifikasi sendiri tidak menyimpan itu.
  function notifikasiUntuk(nrp) {
    if (!nrp) return []
    return notifikasi.map((n) => {
      const sprin = daftar.find((s) => s.id === n.sprinId)
      let subjudul = ''
      if (sprin) {
        for (const k of sprin.kelompok) {
          const p = k.personel.find((pp) => pp.nrp === nrp)
          if (p) {
            subjudul = `${k.nama} sebagai ${p.jabatanOperasional ?? k.nama}. Apel ${sprin.jamApel ?? ''} WIB.`
            break
          }
        }
      }
      return { ...n, nrp, subjudul }
    })
  }

  async function tandaiNotifikasiDibaca(id) {
    setNotifikasi((prev) => prev.map((n) => (n.id === id ? { ...n, dibaca: true } : n)))
    await tandaiNotifikasiDibacaDb(id)
  }

  function riwayatUntuk(nrp) {
    if (!nrp) return []
    const baris = []
    for (const s of daftar) {
      for (const k of s.kelompok) {
        const p = k.personel.find((pp) => pp.nrp === nrp)
        if (p) {
          baris.push({
            sprinId: s.id,
            perihal: s.perihal,
            nomorLengkap: s.nomorLengkap,
            status: s.status,
            waktuLabel: s.waktuLabel,
            jabatanLabel: `${k.kelompokBesar ? k.kelompokBesar + ' · ' : ''}${k.nama} sebagai ${p.jabatanOperasional ?? k.nama}`,
          })
        }
      }
    }
    return baris
  }

  return (
    <SprinContext.Provider
      value={{
        daftar,
        belumPernahDimuat,
        ajukanSprin,
        setujuiSprin,
        kembalikanSprin,
        tetapkanPenandatangan,
        cariSprin,
        notifikasiUntuk,
        tandaiNotifikasiDibaca,
        riwayatUntuk,
        logAktivitas,
      }}
    >
      {children}
    </SprinContext.Provider>
  )
}
