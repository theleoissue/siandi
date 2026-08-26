import {
  Document,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  UnderlineType,
  WidthType,
  TabStopType,
  BorderStyle,
  PageOrientation,
  Packer,
} from 'docx'
import { namaHari, tanggalPanjang } from '../../lib/format'
import { TRIBRATA_JPEG_BASE64 } from './tribrataLogo'

// Tata letak mengikuti Surat Perintah resmi Polres Cimahi (file "DEPAN/DPN
// SPRIN ....docx") -- kop berlambang Tribrata, konsideran Pertimbangan/Dasar/
// Diperintahkan/Untuk, blok tanda tangan DIKOSONGKAN untuk disahkan lewat
// tanda tangan basah atau TTE tersertifikasi (bukan cap/ttd tempel otomatis).

const FONT = 'Arial'
const UKURAN = 22 // half-points = 11pt

// Ubah base64 lambang jadi Uint8Array untuk ImageRun (di browser tak ada Buffer).
function base64KeBytes(b64) {
  const biner = atob(b64)
  const arr = new Uint8Array(biner.length)
  for (let i = 0; i < biner.length; i += 1) arr[i] = biner.charCodeAt(i)
  return arr
}

// Penandatangan resmi belum punya tempat penyimpanan di skema (surat_perintah
// tidak punya kolom penandatangan/pemimpin_apel yang benar-benar terisi) --
// KAPOLRES CIMAHI dipakai sebagai default, sesuai penandatangan mayoritas
// Sprin sumber. Menyusul: pilihan penandatangan per-Sprin di tahap berikutnya.
export const PENANDATANGAN_DEFAULT = {
  nama: 'MOH. FARUK ROZI, S.H, S.I.K., M.Si',
  pangkat: 'AJUN KOMISARIS BESAR POLISI',
  nrp: '85052234',
}

const TANPA_GARIS = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
}

function teks(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: UKURAN, ...opts })
}

function paragraf(children, opts = {}) {
  return new Paragraph({ children, ...opts })
}

function kosong(n = 1) {
  return Array.from({ length: n }, () => paragraf([teks('')]))
}

function sel(children, lebar) {
  return new TableCell({
    borders: TANPA_GARIS,
    width: { size: lebar, type: WidthType.DXA },
    margins: { top: 0, bottom: 40, left: 0, right: 80 },
    children,
  })
}

function barisBerlabel(label, isi) {
  return new TableRow({
    children: [sel([paragraf([teks(label)])], 1500), sel([paragraf([teks(label ? ':' : '')])], 300), sel(isi, 7400)],
  })
}

function barisKosong() {
  return new TableRow({
    children: [sel([paragraf([teks('')])], 1500), sel([paragraf([teks('')])], 300), sel([paragraf([teks('')])], 7400)],
  })
}

function daftarBernomor(arr) {
  return arr.map((butir, i) =>
    paragraf([teks(`${i + 1}.`), teks('\t'), teks(butir)], {
      tabStops: [{ type: TabStopType.LEFT, position: 420 }],
      indent: { left: 420, hanging: 420 },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 60 },
    }),
  )
}

function labelWaktuSprinDocx(sprin) {
  return sprin.tanggalMulai === sprin.tanggalSelesai
    ? `${tanggalPanjang(sprin.tanggalMulai)}`
    : `${tanggalPanjang(sprin.tanggalMulai)} s.d. ${tanggalPanjang(sprin.tanggalSelesai)}`
}

export function bisaDicetakSurat(sprin) {
  return sprin.status === 'Terbit' && sprin.detailLengkap
}

// --- Lampiran daftar personel, jadi satu dokumen dengan surat (halaman landscape) ---

const GARIS_TIPIS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
}

function selTabel(isi, opts = {}) {
  return new TableCell({
    borders: GARIS_TIPIS,
    margins: { top: 20, bottom: 20, left: 60, right: 60 },
    verticalAlign: 'center',
    ...opts,
    children: Array.isArray(isi) ? isi : [paragraf([teks(String(isi ?? ''), opts.run)], { alignment: opts.align })],
  })
}

function barisPersonelLampiran(sprin) {
  const baris = []
  let nomorKeseluruhan = 0
  ;(sprin.kelompok ?? []).forEach((k) => {
    k.personel.forEach((p, j) => {
      nomorKeseluruhan += 1
      baris.push({
        noTotal: nomorKeseluruhan,
        noTim: j + 1,
        nama: p.nama,
        pangkat: p.pangkat ?? '',
        nrp: p.nrp ?? '',
        jabatanStruktur: p.jabatanStruktur ?? '',
        jabatanOperasional: p.jabatanOperasional ?? k.nama,
      })
    })
  })
  return baris
}

const LEBAR_KOLOM_LAMPIRAN = [650, 650, 3400, 1300, 1500, 3900, 3200]
const JUDUL_KOLOM_LAMPIRAN = ['NO', 'NO', 'NAMA', 'PANGKAT', 'NRP / NIP', 'JABATAN STRUKTUR', 'JABATAN OPERASIONAL']

function bangunSectionLampiran(sprin, penandatangan) {
  const labelWaktu =
    sprin.tanggalMulai === sprin.tanggalSelesai
      ? `HARI ${namaHari(sprin.tanggalMulai).toUpperCase()} TANGGAL ${tanggalPanjang(sprin.tanggalMulai).toUpperCase()}`
      : `TANGGAL ${tanggalPanjang(sprin.tanggalMulai).toUpperCase()} S.D. ${tanggalPanjang(sprin.tanggalSelesai).toUpperCase()}`

  const kanan = (t, o = {}) => paragraf([teks(t, o)], { alignment: AlignmentType.RIGHT })

  const kepala = [
    kanan('LAMPIRAN SURAT PERINTAH'),
    kanan('KAPOLRES CIMAHI'),
    kanan(`NOMOR  : ${sprin.nomorLengkap}`),
    kanan(`TANGGAL  : ${tanggalPanjang(sprin.tanggalMulai).toUpperCase()}`),
    ...kosong(1),
    paragraf([teks(`DAFTAR PERSONEL ${(sprin.perihal || '').toUpperCase()}`, { bold: true })], { alignment: AlignmentType.CENTER }),
    paragraf([teks(labelWaktu, { bold: true })], { alignment: AlignmentType.CENTER }),
    ...kosong(1),
  ]

  const barisJudul = new TableRow({
    tableHeader: true,
    children: JUDUL_KOLOM_LAMPIRAN.map((h, i) =>
      selTabel([paragraf([teks(h, { bold: true, size: 20 })], { alignment: AlignmentType.CENTER })], {
        width: { size: LEBAR_KOLOM_LAMPIRAN[i], type: WidthType.DXA },
        shading: { fill: 'E8E8E8' },
      }),
    ),
  })

  const barisData = barisPersonelLampiran(sprin).map(
    (b) =>
      new TableRow({
        children: [
          selTabel(b.noTotal, { align: AlignmentType.CENTER, run: { size: 20 } }),
          selTabel(b.noTim, { align: AlignmentType.CENTER, run: { size: 20 } }),
          selTabel(b.nama, { run: { size: 20 } }),
          selTabel(b.pangkat, { align: AlignmentType.CENTER, run: { size: 20 } }),
          selTabel(b.nrp, { align: AlignmentType.CENTER, run: { size: 20 } }),
          selTabel(b.jabatanStruktur, { run: { size: 20 } }),
          selTabel(b.jabatanOperasional, { run: { size: 20 } }),
        ],
      }),
  )

  const tabel = new Table({
    width: { size: LEBAR_KOLOM_LAMPIRAN.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: LEBAR_KOLOM_LAMPIRAN,
    rows: [barisJudul, ...barisData],
  })

  const ttd = [
    ...kosong(1),
    kanan('Dikeluarkan di : Cimahi'),
    kanan(`pada tanggal : ${tanggalPanjang(sprin.tanggalMulai)}`),
    kanan('KEPALA KEPOLISIAN RESOR CIMAHI POLDA JABAR'),
    ...kosong(4),
    kanan(String(penandatangan.nama).toUpperCase(), { underline: { type: UnderlineType.SINGLE } }),
    kanan(`${penandatangan.pangkat} NRP ${penandatangan.nrp}`),
  ]

  return {
    properties: {
      page: {
        size: { width: 16838, height: 11906, orientation: PageOrientation.LANDSCAPE },
        margin: { top: 720, bottom: 720, left: 720, right: 720 },
      },
    },
    children: [...kepala, tabel, ...ttd],
  }
}

export async function buatBlobSuratDocx(sprin, penandatangan = PENANDATANGAN_DEFAULT) {
  const kop = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new ImageRun({
          type: 'jpg',
          data: base64KeBytes(TRIBRATA_JPEG_BASE64),
          transformation: { width: 62, height: 62 },
        }),
      ],
    }),
    paragraf([teks('KEPOLISIAN NEGARA REPUBLIK INDONESIA', { size: 20 })], { alignment: AlignmentType.CENTER }),
    paragraf([teks('DAERAH JAWA BARAT', { size: 20 })], { alignment: AlignmentType.CENTER }),
    paragraf([teks('RESOR CIMAHI', { size: 20, underline: { type: UnderlineType.SINGLE } })], {
      alignment: AlignmentType.CENTER,
    }),
    ...kosong(1),
    paragraf([teks('SURAT PERINTAH', { underline: { type: UnderlineType.SINGLE } })], { alignment: AlignmentType.CENTER }),
    paragraf([teks(`Nomor : ${sprin.nomorLengkap}`)], { alignment: AlignmentType.CENTER }),
    ...kosong(1),
  ]

  const isi = new Table({
    width: { size: 9200, type: WidthType.DXA },
    columnWidths: [1500, 300, 7400],
    borders: TANPA_GARIS,
    rows: [
      barisBerlabel('Pertimbangan', [paragraf([teks(sprin.pertimbangan || '—')], { alignment: AlignmentType.JUSTIFIED })]),
      barisKosong(),
      barisBerlabel('Dasar', daftarBernomor(sprin.dasar ?? [])),
      barisKosong(),
      new TableRow({
        children: [
          sel([paragraf([teks('')])], 1500),
          sel([paragraf([teks('')])], 300),
          sel([paragraf([teks('DIPERINTAHKAN')], { alignment: AlignmentType.CENTER })], 7400),
        ],
      }),
      barisKosong(),
      barisBerlabel('Kepada', [
        paragraf([teks('PARA PERSONEL POLRI POLRES CIMAHI YANG NAMA, PANGKAT DAN JABATANNYA TERLAMPIR DALAM SURAT PERINTAH INI.')], {
          alignment: AlignmentType.JUSTIFIED,
        }),
      ]),
      barisKosong(),
      barisBerlabel('Untuk', daftarBernomor(sprin.untuk ?? [])),
    ],
  })

  const blokTtd = new Table({
    width: { size: 9600, type: WidthType.DXA },
    columnWidths: [3500, 6100],
    borders: TANPA_GARIS,
    rows: [
      new TableRow({
        children: [
          new TableCell({ borders: TANPA_GARIS, width: { size: 3500, type: WidthType.DXA }, children: [paragraf([teks('')])] }),
          new TableCell({
            borders: TANPA_GARIS,
            width: { size: 6100, type: WidthType.DXA },
            children: [
              paragraf([teks('Dikeluarkan di'), teks('\t'), teks(': Cimahi')], {
                tabStops: [{ type: TabStopType.LEFT, position: 1500 }],
              }),
              paragraf([teks('pada tanggal'), teks('\t'), teks(`: ${tanggalPanjang(sprin.tanggalMulai)}`)], {
                tabStops: [{ type: TabStopType.LEFT, position: 1500 }],
              }),
              paragraf([teks('KEPALA KEPOLISIAN RESOR CIMAHI POLDA JABAR')], { alignment: AlignmentType.CENTER }),
              ...kosong(4),
              paragraf([teks(String(penandatangan.nama).toUpperCase(), { underline: { type: UnderlineType.SINGLE } })], {
                alignment: AlignmentType.CENTER,
              }),
              paragraf([teks(`${penandatangan.pangkat} NRP ${penandatangan.nrp}`)], { alignment: AlignmentType.CENTER }),
            ],
          }),
        ],
      }),
    ],
  })

  const sectionSurat = {
    // Margin mengikuti dokumen Sprin asli (twips): atas/kanan ~709, kiri ~799.
    // Bawah diberi ruang wajar (real memakai 0, terlalu mepet untuk cetak).
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 800, right: 709 } } },
    children: [
      ...kop,
      isi,
      ...kosong(1),
      paragraf([teks('Selesai.')]),
      ...kosong(1),
      blokTtd,
      ...kosong(1),
      paragraf([teks('Tembusan :', { size: 20 })]),
      paragraf([teks('1.\tKapolda Jabar', { size: 20 })], { tabStops: [{ type: TabStopType.LEFT, position: 400 }] }),
      paragraf([teks('2.\tWakapolres Cimahi', { size: 20 })], { tabStops: [{ type: TabStopType.LEFT, position: 400 }] }),
    ],
  }

  // Lampiran daftar personel digabung sebagai section (halaman) berikutnya --
  // satu file .docx berisi surat + lampiran, sesuai permintaan.
  const adaPersonel = (sprin.kelompok ?? []).some((k) => k.personel.length > 0)
  const sections = adaPersonel ? [sectionSurat, bangunSectionLampiran(sprin, penandatangan)] : [sectionSurat]

  const dokumen = new Document({
    styles: { default: { document: { run: { font: FONT, size: UKURAN } } } },
    sections,
  })

  return Packer.toBlob(dokumen)
}

// dipakai file lampiran juga -- diekspor supaya tidak dobel logika format tanggal
export { labelWaktuSprinDocx, namaHari }
