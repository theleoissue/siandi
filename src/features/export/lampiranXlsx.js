import * as XLSX from 'xlsx'
import { namaHari, tanggalPanjang } from '../../lib/format'
import { PENANDATANGAN_DEFAULT } from './suratDocx'

// Struktur diambil persis dari fungsi cetak .xlsx yang sudah ada di
// SIANDI_Mockup_v3.html (fungsi tE + ih) -- dibangun ulang dengan nama jelas.

function barisFlat(sprin) {
  const baris = []
  let bandSaatIni
  let nomorKeseluruhan = 0
  sprin.kelompok.forEach((k, i) => {
    if (k.kelompokBesar !== bandSaatIni) {
      bandSaatIni = k.kelompokBesar
      if (bandSaatIni) baris.push({ tipe: 'band', teks: bandSaatIni })
    }
    if (i > 0) baris.push({ tipe: 'pisah' })
    k.personel.forEach((p, j) => {
      nomorKeseluruhan += 1
      baris.push({
        tipe: 'orang',
        noTotal: nomorKeseluruhan,
        noTim: j + 1,
        nama: p.nama,
        pangkat: p.pangkat,
        nrp: p.nrp,
        jabatanStruktur: p.jabatanStruktur,
        tampil: p.jabatanOperasional ?? k.nama,
      })
    })
  })
  return baris
}

export function buatBlobLampiranXlsx(sprin, penandatangan = PENANDATANGAN_DEFAULT) {
  const labelWaktu =
    sprin.tanggalMulai === sprin.tanggalSelesai
      ? `HARI ${namaHari(sprin.tanggalMulai).toUpperCase()} TANGGAL ${tanggalPanjang(sprin.tanggalMulai).toUpperCase()}`
      : `TANGGAL ${tanggalPanjang(sprin.tanggalMulai).toUpperCase()} S.D. ${tanggalPanjang(sprin.tanggalSelesai).toUpperCase()}`

  const baris = [
    ['', '', '', '', '', 'LAMPIRAN SPRIN KAPOLRES CIMAHI'],
    ['', '', '', '', '', `NOMOR : ${sprin.nomorLengkap}`],
    ['', '', '', '', '', `TANGGAL : ${tanggalPanjang(sprin.tanggalMulai).toUpperCase()}`],
    [],
    [`DAFTAR PERSONEL ${(sprin.perihal || '').toUpperCase()}`],
    [labelWaktu],
    [],
    ['NO', 'NO', 'NAMA', 'PANGKAT', 'NRP / NIP', 'JABATAN STRUKTUR', 'JABATAN OPERASIONAL'],
  ]

  for (const b of barisFlat(sprin)) {
    if (b.tipe === 'band') baris.push([], [b.teks])
    else if (b.tipe === 'pisah') baris.push([])
    else baris.push([b.noTotal, b.noTim, b.nama, b.pangkat, b.nrp ?? '', b.jabatanStruktur ?? '', b.tampil])
  }

  baris.push(
    [],
    ['', '', '', '', '', 'Dikeluarkan di : Cimahi'],
    ['', '', '', '', '', `pada tanggal : ${tanggalPanjang(sprin.tanggalMulai)}`],
    ['', '', '', '', '', 'KEPALA KEPOLISIAN RESOR CIMAHI POLDA JABAR'],
    [],
    [],
    ['', '', '', '', '', String(penandatangan.nama).toUpperCase()],
    ['', '', '', '', '', `${penandatangan.pangkat} NRP ${penandatangan.nrp}`],
  )

  const sheet = XLSX.utils.aoa_to_sheet(baris)
  sheet['!cols'] = [{ wch: 5 }, { wch: 5 }, { wch: 40 }, { wch: 11 }, { wch: 20 }, { wch: 36 }, { wch: 30 }]
  const buku = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(buku, sheet, 'Lampiran')
  const array = XLSX.write(buku, { bookType: 'xlsx', type: 'array' })
  return new Blob([array], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
