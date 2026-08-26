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

  const dokumen = new Document({
    styles: { default: { document: { run: { font: FONT, size: UKURAN } } } },
    sections: [
      {
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
      },
    ],
  })

  return Packer.toBlob(dokumen)
}

// dipakai file lampiran juga -- diekspor supaya tidak dobel logika format tanggal
export { labelWaktuSprinDocx, namaHari }
