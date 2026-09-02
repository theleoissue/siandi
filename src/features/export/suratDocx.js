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
  Header,
  PageNumber,
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
  // Wajib: tanpa ini, border antar-sel bagian dalam tabel muncul sebagai garis
  // (surat jadi kelihatan seperti formulir berkotak, bukan surat bersih).
  insideHorizontal: { style: BorderStyle.NONE },
  insideVertical: { style: BorderStyle.NONE },
}

// Warna hitam dipaksa eksplisit (bukan cuma andalkan default "auto") --
// beberapa penampil (termasuk pratinjau di web) pernah salah resolve warna
// default jadi warna tema (emas) untuk elemen underline kalau tidak diset
// eksplisit di kedua tempat: warna teks DAN warna garis bawahnya sendiri.
function teks(text, opts = {}) {
  const underline = opts.underline ? { color: '000000', ...opts.underline } : undefined
  return new TextRun({ text, font: FONT, size: UKURAN, color: '000000', ...opts, ...(underline ? { underline } : {}) })
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
    margins: { top: 0, bottom: 30, left: 0, right: 80 },
    children,
  })
}

function barisBerlabel(label, isi) {
  return new TableRow({
    children: [sel([paragraf([teks(label)])], 1700), sel([paragraf([teks(label ? ':' : '')])], 300), sel(isi, 7100)],
  })
}

function barisKosong() {
  return new TableRow({
    children: [sel([paragraf([teks('')])], 1700), sel([paragraf([teks('')])], 300), sel([paragraf([teks('')])], 7100)],
  })
}

function daftarBernomor(arr) {
  return arr.map((butir, i) =>
    paragraf([teks(`${i + 1}.`), teks('\t'), teks(butir)], {
      tabStops: [{ type: TabStopType.LEFT, position: 420 }],
      indent: { left: 420, hanging: 420 },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 60, line: 240, lineRule: 'auto' },
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

function bangunSectionLampiran(sprin, penandatangan) {
  const labelWaktu =
    sprin.tanggalMulai === sprin.tanggalSelesai
      ? `HARI ${namaHari(sprin.tanggalMulai).toUpperCase()} TANGGAL ${tanggalPanjang(sprin.tanggalMulai).toUpperCase()}`
      : `TANGGAL ${tanggalPanjang(sprin.tanggalMulai).toUpperCase()} S.D. ${tanggalPanjang(sprin.tanggalSelesai).toUpperCase()}`

  // Kepala lampiran meniru dokumen LAMP asli: kop instansi (teks, bukan gambar
  // lambang) di kiri sejajar dengan blok "LAMPIRAN SPRIN..." di kanan --
  // disusun sebagai tabel 2 kolom tanpa garis.
  // Lebar tabel kop disamakan dengan lebar tabel personel (mengikuti kertas
  // landscape penuh) supaya blok kanan "LAMPIRAN SURAT PERINTAH..." tertarik
  // sampai margin kanan kertas, bukan cuma setengah lebar portrait lama.
  const LEBAR_KEPALA_LAMPIRAN = LEBAR_KOLOM_LAMPIRAN.reduce((a, b) => a + b, 0)
  const LEBAR_KOLOM_KEPALA = LEBAR_KEPALA_LAMPIRAN / 2
  // Ruler Word di dalam sel tabel mulai dari 0 di tepi kiri sel itu sendiri --
  // target "angka 9" (9cm dari tepi kiri sel, sama seperti kop surat depan)
  // berarti sisa ruang di kanan (indent) = lebar sel - 9cm.
  const TWIP_PER_CM = 566.9294
  const INDENT_KOP_LAMPIRAN_NILAI = Math.round(LEBAR_KOLOM_KEPALA - 9 * TWIP_PER_CM)
  const INDENT_KOP_LAMPIRAN = { right: INDENT_KOP_LAMPIRAN_NILAI }
  const kanan = (t, o = {}) => paragraf([teks(t, o)], { alignment: AlignmentType.RIGHT })
  // Sisi kanan kop (blok "LAMPIRAN SURAT PERINTAH...") dibuat mirror dari sisi
  // kiri: center + indent kiri sebesar nilai yang sama, supaya blok ini
  // tertarik rapi ke sisi kanan alih-alih rata kanan mentah. Khusus kop, tidak
  // dipakai untuk blok tanda tangan di bawah (itu tetap pakai `kanan` biasa).
  const kananKop = (t, o = {}) => paragraf([teks(t, o)], { alignment: AlignmentType.CENTER, indent: { left: INDENT_KOP_LAMPIRAN_NILAI } })
  const kepalaKiriKanan = new Table({
    width: { size: LEBAR_KEPALA_LAMPIRAN, type: WidthType.DXA },
    columnWidths: [LEBAR_KOLOM_KEPALA, LEBAR_KOLOM_KEPALA],
    borders: TANPA_GARIS,
    rows: [
      new TableRow({
        children: [
          sel(
            [
              paragraf([teks('KEPOLISIAN NEGARA REPUBLIK INDONESIA', { size: 20 })], { alignment: AlignmentType.CENTER, indent: INDENT_KOP_LAMPIRAN, spacing: { after: 0 } }),
              paragraf([teks('DAERAH JAWA BARAT', { size: 20 })], { alignment: AlignmentType.CENTER, indent: INDENT_KOP_LAMPIRAN, spacing: { after: 0 } }),
              paragraf([teks('RESOR CIMAHI', { size: 20 })], {
                alignment: AlignmentType.CENTER,
                indent: INDENT_KOP_LAMPIRAN,
                border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000', space: 1 } },
              }),
            ],
            LEBAR_KOLOM_KEPALA,
          ),
          sel(
            [
              kananKop('LAMPIRAN SURAT PERINTAH'),
              kananKop('KAPOLRES CIMAHI'),
              kananKop(`NOMOR  : ${sprin.nomorLengkap}`),
              kananKop(`TANGGAL  : ${tanggalPanjang(sprin.tanggalMulai).toUpperCase()}`),
            ],
            LEBAR_KOLOM_KEPALA,
          ),
        ],
      }),
    ],
  })

  const kepala = [
    kepalaKiriKanan,
    ...kosong(1),
    paragraf([teks(`DAFTAR PERSONEL ${(sprin.perihal || '').toUpperCase()}`, { bold: true })], { alignment: AlignmentType.CENTER }),
    paragraf([teks(labelWaktu, { bold: true })], {
      alignment: AlignmentType.CENTER,
      // Garis pembatas di bawah judul, sesuai dokumen LAMP asli, sebelum masuk tabel.
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 4 } },
    }),
    ...kosong(1),
  ]

  // Header tabel 2 tingkat sesuai LAMP asli: "NO" gabungan URUT+SAT GAS,
  // "JABATAN" gabungan STRUKTUR+OPERASIONAL.
  const jSel = (t, opts = {}) =>
    selTabel([paragraf([teks(t, { bold: true, size: 20 })], { alignment: AlignmentType.CENTER })], {
      shading: { fill: 'E8E8E8' },
      verticalAlign: 'center',
      ...opts,
    })
  const barisJudulAtas = new TableRow({
    tableHeader: true,
    children: [
      jSel('NO', { columnSpan: 2, width: { size: LEBAR_KOLOM_LAMPIRAN[0] + LEBAR_KOLOM_LAMPIRAN[1], type: WidthType.DXA } }),
      jSel('NAMA', { rowSpan: 2, width: { size: LEBAR_KOLOM_LAMPIRAN[2], type: WidthType.DXA } }),
      jSel('PANGKAT', { rowSpan: 2, width: { size: LEBAR_KOLOM_LAMPIRAN[3], type: WidthType.DXA } }),
      jSel('NRP / NIP', { rowSpan: 2, width: { size: LEBAR_KOLOM_LAMPIRAN[4], type: WidthType.DXA } }),
      jSel('JABATAN', { columnSpan: 2, width: { size: LEBAR_KOLOM_LAMPIRAN[5] + LEBAR_KOLOM_LAMPIRAN[6], type: WidthType.DXA } }),
    ],
  })
  const barisJudulBawah = new TableRow({
    tableHeader: true,
    children: [
      jSel('URUT', { width: { size: LEBAR_KOLOM_LAMPIRAN[0], type: WidthType.DXA } }),
      jSel('SAT GAS', { width: { size: LEBAR_KOLOM_LAMPIRAN[1], type: WidthType.DXA } }),
      jSel('STRUKTUR', { width: { size: LEBAR_KOLOM_LAMPIRAN[5], type: WidthType.DXA } }),
      jSel('OPERASIONAL', { width: { size: LEBAR_KOLOM_LAMPIRAN[6], type: WidthType.DXA } }),
    ],
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
    rows: [barisJudulAtas, barisJudulBawah, ...barisData],
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
        // Beri dimensi PORTRAIT + orientation LANDSCAPE; docx v9 yang menukar
        // lebar/tinggi. Kalau diberi dimensi landscape sekaligus orientation,
        // ter-swap dua kali dan malah balik portrait (tabel lebar terpotong).
        size: { orientation: PageOrientation.LANDSCAPE, width: 11906, height: 16838 },
        margin: { top: 720, bottom: 720, left: 720, right: 720 },
      },
      // Halaman pertama beda dari halaman berikutnya (differentFirst di dokumen
      // asli) -- kop lengkap sudah ada di badan halaman 1, jadi header berulang
      // di bawah cuma perlu muncul mulai halaman 2 supaya tidak dobel.
      titlePage: true,
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              teks('LAMPIRAN SURAT PERINTAH KAPOLRES CIMAHI — ', { size: 18 }),
              teks(sprin.nomorLengkap, { size: 18 }),
              teks(' — hal. ', { size: 18 }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18 }),
            ],
          }),
        ],
      }),
      first: new Header({ children: [new Paragraph({ children: [] })] }),
    },
    children: [...kepala, tabel, ...ttd],
  }
}

export async function buatBlobSuratDocx(sprin, penandatangan = PENANDATANGAN_DEFAULT) {
  // Susunan kop mengikuti Surat Perintah Polres Cimahi asli persis, dicek dari
  // XML dokumen sumber: 3 baris nama instansi bukan literally rata kiri,
  // melainkan tetap CENTER tapi dengan indent kanan 5155 twips (~9,1cm --
  // "angka 9" di ruler Word) yang mempersempit kolom pusatnya, jadi teks
  // kelihatan condong ke kiri walau teknis masih center. Kode klasifikasi di
  // pojok kanan atas, lambang Tribrata di tengah bawahnya, baru judul + nomor.
  const INDENT_KOP = { right: 5155 }
  const kop = [
    paragraf([teks(sprin.kodeKlasifikasi || '', { size: 20 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } }),
    paragraf([teks('KEPOLISIAN NEGARA REPUBLIK INDONESIA', { size: 22 })], { alignment: AlignmentType.CENTER, indent: INDENT_KOP, spacing: { after: 0 } }),
    paragraf([teks('DAERAH JAWA BARAT', { size: 22 })], { alignment: AlignmentType.CENTER, indent: INDENT_KOP, spacing: { after: 0 } }),
    paragraf([teks('RESOR CIMAHI', { size: 22 })], {
      alignment: AlignmentType.CENTER,
      indent: INDENT_KOP,
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000', space: 1 } },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 20 },
      children: [
        new ImageRun({ type: 'jpg', data: base64KeBytes(TRIBRATA_JPEG_BASE64), transformation: { width: 60, height: 60 } }),
      ],
    }),
    paragraf([teks('SURAT PERINTAH', { characterSpacing: 40, underline: { type: UnderlineType.SINGLE } })], {
      alignment: AlignmentType.CENTER,
    }),
    paragraf([teks(`Nomor : ${sprin.nomorLengkap}`)], { alignment: AlignmentType.CENTER }),
    ...kosong(1),
  ]

  const isi = new Table({
    width: { size: 9100, type: WidthType.DXA },
    columnWidths: [1700, 300, 7100],
    borders: TANPA_GARIS,
    rows: [
      barisBerlabel('Pertimbangan', [paragraf([teks(sprin.pertimbangan || '—')], { alignment: AlignmentType.JUSTIFIED })]),
      barisKosong(),
      barisBerlabel('Dasar', daftarBernomor(sprin.dasar ?? [])),
      barisKosong(),
      new TableRow({
        children: [
          sel([paragraf([teks('')])], 1700),
          sel([paragraf([teks('')])], 300),
          sel([paragraf([teks('DIPERINTAHKAN', { bold: true })], { alignment: AlignmentType.CENTER })], 7100),
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
              paragraf([teks(String(penandatangan.nama).toUpperCase(), { bold: true, underline: { type: UnderlineType.SINGLE } })], {
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
    properties: {
      page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 1134, right: 851 } },
      // Halaman 1 sudah punya kop lengkap di badan surat -- header berulang di
      // bawah cuma perlu muncul mulai halaman 2 kalau Dasar/Untuk panjang.
      titlePage: true,
    },
    headers: {
      default: new Header({
        children: [
          paragraf([teks('SURAT PERINTAH KAPOLRES CIMAHI', { size: 20 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
          paragraf([teks(`NOMOR : ${sprin.nomorLengkap}`, { size: 20 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
          paragraf([teks(`TANGGAL : ${tanggalPanjang(sprin.tanggalMulai).toUpperCase()}`, { size: 20 })], { alignment: AlignmentType.CENTER }),
        ],
      }),
      first: new Header({ children: [new Paragraph({ children: [] })] }),
    },
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
    styles: { default: { document: { run: { font: FONT, size: UKURAN }, paragraph: { spacing: { line: 240, lineRule: 'auto', after: 0 } } } } },
    sections,
  })

  return Packer.toBlob(dokumen)
}

// dipakai file lampiran juga -- diekspor supaya tidak dobel logika format tanggal
export { labelWaktuSprinDocx, namaHari }
