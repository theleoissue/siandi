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

// Skalakan proporsi lebar kolom ke total lebar target (mis. lebar isi halaman
// setelah margin) -- supaya tabel selalu mengikuti margin: margin mengecil,
// lebar isi bertambah, tabel ikut melebar (kolom terakhir menyerap sisa
// pembulatan supaya totalnya presisi).
function skalakanLebar(kolom, totalTarget) {
  const total = kolom.reduce((a, b) => a + b, 0)
  const faktor = totalTarget / total
  const hasil = kolom.map((w) => Math.round(w * faktor))
  const selisih = totalTarget - hasil.reduce((a, b) => a + b, 0)
  hasil[hasil.length - 1] += selisih
  return hasil
}

function barisBerlabel(label, isi, kolom = [1700, 300, 7100]) {
  return new TableRow({
    children: [sel([paragraf([teks(label)])], kolom[0]), sel([paragraf([teks(label ? ':' : '')])], kolom[1]), sel(isi, kolom[2])],
  })
}

function barisKosong(kolom = [1700, 300, 7100]) {
  return new TableRow({
    children: [sel([paragraf([teks('')])], kolom[0]), sel([paragraf([teks('')])], kolom[1]), sel([paragraf([teks('')])], kolom[2])],
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

const LEBAR_KOLOM_LAMPIRAN_DASAR = [650, 650, 3400, 1300, 1500, 3900, 3200]

// Lebar render nyata "KEPOLISIAN NEGARA REPUBLIK INDONESIA" pada size 22
// (11pt) sudah diverifikasi pas lewat render Word di kop surat depan: lebar
// isi surat depan (9921 twip) dikurangi indent asli dari XML dokumen sumber
// (5155 twip) = 4766 twip. Dipakai sebagai acuan untuk menyesuaikan lebar
// border di tempat lain yang memakai ukuran font berbeda (mis. kop lampiran).
const LEBAR_TEKS_KOP_INSTANSI_11PT = 4766

// Tabel info "LAMPIRAN SPRIN KAPOLRES CIMAHI / NOMOR / TANGGAL" bergaris
// horizontal + no. halaman di kiri -- dipakai sama persis di kop halaman
// pertama lampiran (kepalaKiriKanan) dan header berulang halaman 2 dst,
// supaya keduanya konsisten. `lebarTotal` menentukan seberapa "padat" tabel
// ini (dipanggil dengan lebar berbeda di tiap tempat).
function buatTabelInfoLampiran(sprin, lebarTotal, { rataKanan = true } = {}) {
  const KOLOM = skalakanLebar([450, 1300, 350, 6950], lebarTotal)
  const TANPA_GARIS_LUAR = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    insideVertical: { style: BorderStyle.NONE },
  }
  const cellInfo = (children, opts = {}) => new TableCell({ margins: { top: 20, bottom: 20, left: 40, right: 40 }, verticalAlign: 'center', ...opts, children })
  const nilai = (t) => paragraf([teks(t, { size: 18 })], { alignment: AlignmentType.DISTRIBUTE })
  const kosongInfo = () => cellInfo([paragraf([teks('')])])
  return new Table({
    alignment: rataKanan ? AlignmentType.RIGHT : undefined,
    width: { size: lebarTotal, type: WidthType.DXA },
    columnWidths: KOLOM,
    borders: TANPA_GARIS_LUAR,
    rows: [
      new TableRow({
        children: [
          cellInfo(
            [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18 })] })],
            { rowSpan: 4, verticalAlign: 'top', margins: { top: 20, bottom: 20, left: 40, right: 220 } },
          ),
          cellInfo([paragraf([teks('LAMPIRAN SPRIN KAPOLRES CIMAHI', { size: 18 })], { alignment: AlignmentType.DISTRIBUTE })], {
            columnSpan: 3,
            width: { size: KOLOM[1] + KOLOM[2] + KOLOM[3], type: WidthType.DXA },
          }),
        ],
      }),
      new TableRow({
        children: [
          cellInfo([paragraf([teks('NOMOR', { size: 18 })])]),
          cellInfo([paragraf([teks(':', { size: 18 })], { alignment: AlignmentType.CENTER })]),
          cellInfo([nilai(sprin.nomorLengkap)]),
        ],
      }),
      new TableRow({
        children: [
          cellInfo([paragraf([teks('TANGGAL', { size: 18 })])]),
          cellInfo([paragraf([teks(':', { size: 18 })], { alignment: AlignmentType.CENTER })]),
          cellInfo([nilai(tanggalPanjang(sprin.tanggalMulai).toUpperCase())]),
        ],
      }),
      new TableRow({ children: [kosongInfo(), kosongInfo(), kosongInfo()] }),
    ],
  })
}

function bangunSectionLampiran(sprin, penandatangan) {
  const labelWaktu =
    sprin.tanggalMulai === sprin.tanggalSelesai
      ? `HARI ${namaHari(sprin.tanggalMulai).toUpperCase()} TANGGAL ${tanggalPanjang(sprin.tanggalMulai).toUpperCase()}`
      : `TANGGAL ${tanggalPanjang(sprin.tanggalMulai).toUpperCase()} S.D. ${tanggalPanjang(sprin.tanggalSelesai).toUpperCase()}`

  // Tabel-tabel lampiran selalu melebar mengikuti sisa lebar kertas landscape
  // setelah margin (bukan lebar tetap) -- margin kecil, tabel ikut melebar.
  const MARGIN_LAMPIRAN = { top: 567, bottom: 567, left: 567, right: 567 }
  const LEBAR_ISI_LAMPIRAN = 16838 - MARGIN_LAMPIRAN.left - MARGIN_LAMPIRAN.right
  const LEBAR_KOLOM_LAMPIRAN = skalakanLebar(LEBAR_KOLOM_LAMPIRAN_DASAR, LEBAR_ISI_LAMPIRAN)

  // Kepala lampiran meniru dokumen LAMP asli: kop instansi (teks, bukan gambar
  // lambang) di kiri sejajar dengan blok "LAMPIRAN SPRIN..." di kanan --
  // disusun sebagai tabel 2 kolom tanpa garis.
  // Lebar tabel kop disamakan dengan lebar tabel personel (mengikuti kertas
  // landscape penuh) supaya blok kanan "LAMPIRAN SURAT PERINTAH..." tertarik
  // sampai margin kanan kertas, bukan cuma setengah lebar portrait lama.
  const LEBAR_KEPALA_LAMPIRAN = LEBAR_KOLOM_LAMPIRAN.reduce((a, b) => a + b, 0)
  const LEBAR_KOLOM_KEPALA = LEBAR_KEPALA_LAMPIRAN / 2
  // Border bawah "RESOR CIMAHI" harus pas menempel di teks terpanjang, bukan
  // kepanjangan -- kop lampiran pakai font lebih kecil (size 20/10pt) daripada
  // kop surat depan (size 22/11pt), jadi lebar teks acuan diskalakan turun.
  // +150 twip: sel tabel (lihat sel()) punya margin kanan 80 twip sendiri yang
  // memakan sisa ruang baris -- tanpa buffer ini "INDONESIA" malah terlempar
  // ke baris baru (diverifikasi lewat render Word, bukan cuma dihitung).
  const LEBAR_TEKS_KOP_LAMPIRAN = Math.round(LEBAR_TEKS_KOP_INSTANSI_11PT * (20 / 22)) + 150
  const INDENT_KOP_LAMPIRAN_NILAI = LEBAR_KOLOM_KEPALA - LEBAR_TEKS_KOP_LAMPIRAN
  const INDENT_KOP_LAMPIRAN = { right: INDENT_KOP_LAMPIRAN_NILAI }
  const kanan = (t, o = {}) => paragraf([teks(t, o)], { alignment: AlignmentType.RIGHT })
  // Kop kanan halaman pertama (di badan surat, bukan header berulang) pakai
  // tabel info yang sama persis dengan header halaman 2 dst -- dipadatkan ke
  // kanan dengan proporsi yang sama (LEBAR_HEADER_ULANG / LEBAR_ISI_LAMPIRAN)
  // supaya kelihatan konsisten walau ditempatkan di kolom setengah halaman.
  const RASIO_PADAT_INFO = (LEBAR_ISI_LAMPIRAN - Math.round(8.5 * 566.9294)) / LEBAR_ISI_LAMPIRAN
  const LEBAR_INFO_KEPALA = Math.round(LEBAR_KOLOM_KEPALA * RASIO_PADAT_INFO)
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
          new TableCell({
            borders: TANPA_GARIS,
            width: { size: LEBAR_KOLOM_KEPALA, type: WidthType.DXA },
            children: [buatTabelInfoLampiran(sprin, LEBAR_INFO_KEPALA)],
          }),
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
        margin: MARGIN_LAMPIRAN,
        // Nomor halaman lampiran mulai ulang dari 1 -- tanpa ini Word
        // melanjutkan hitungan dari section surat depan (mis. jadi "4"
        // padahal ini baru halaman ke-1 lampiran).
        pageNumbers: { start: 1 },
      },
      // Halaman pertama beda dari halaman berikutnya (differentFirst di dokumen
      // asli) -- kop lengkap sudah ada di badan halaman 1, jadi header berulang
      // di bawah cuma perlu muncul mulai halaman 2 supaya tidak dobel.
      titlePage: true,
    },
    headers: {
      // Header halaman lampiran ke-2 dst: sama polanya dengan header surat
      // depan (no. halaman + tabel 3 baris, garis pemisah horizontal saja),
      // tapi ditarik ke pojok kanan -- mulai dari ruler ~8,5cm, bukan
      // selebar penuh kertas landscape.
      default: (() => {
        const TWIP_PER_CM_HDR = 566.9294
        const LEBAR_HEADER_ULANG = LEBAR_ISI_LAMPIRAN - Math.round(8.5 * TWIP_PER_CM_HDR)
        return new Header({ children: [buatTabelInfoLampiran(sprin, LEBAR_HEADER_ULANG)] })
      })(),
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
  // Margin surat depan (dari dokumen asli, lihat sectionSurat di bawah) --
  // tabel isi & blok tanda tangan dihitung dari sini juga, supaya keduanya
  // otomatis melebar/menyempit kalau margin berubah, bukan lebar tetap.
  // header/footer diset lebih kecil dari top/bottom -- kalau dibiarkan default
  // (708 twip), Word mendorong badan teks turun untuk memberi ruang header,
  // jadi margin atas kelihatan bukan 1cm sampai kita klik ke area header.
  const MARGIN_SURAT = { top: 567, bottom: 283, left: 1134, right: 851, header: 200, footer: 200 }
  const LEBAR_ISI_SURAT = 11906 - MARGIN_SURAT.left - MARGIN_SURAT.right
  const KOLOM_ISI = skalakanLebar([1700, 300, 7100], LEBAR_ISI_SURAT)
  const KOLOM_TTD = skalakanLebar([3500, 6100], LEBAR_ISI_SURAT)
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
        new ImageRun({ type: 'jpg', data: base64KeBytes(TRIBRATA_JPEG_BASE64), transformation: { width: 49, height: 49 } }),
      ],
    }),
    paragraf([teks('SURAT PERINTAH', { characterSpacing: 40, underline: { type: UnderlineType.SINGLE } })], {
      alignment: AlignmentType.CENTER,
    }),
    paragraf([teks(`Nomor : ${sprin.nomorLengkap}`)], { alignment: AlignmentType.CENTER }),
    ...kosong(1),
  ]

  const isi = new Table({
    width: { size: LEBAR_ISI_SURAT, type: WidthType.DXA },
    columnWidths: KOLOM_ISI,
    borders: TANPA_GARIS,
    rows: [
      barisBerlabel('Pertimbangan', [paragraf([teks(sprin.pertimbangan || '—')], { alignment: AlignmentType.JUSTIFIED })], KOLOM_ISI),
      barisKosong(KOLOM_ISI),
      barisBerlabel('Dasar', daftarBernomor(sprin.dasar ?? []), KOLOM_ISI),
      barisKosong(KOLOM_ISI),
      new TableRow({
        children: [
          sel([paragraf([teks('')])], KOLOM_ISI[0]),
          sel([paragraf([teks('')])], KOLOM_ISI[1]),
          sel([paragraf([teks('DIPERINTAHKAN', { bold: true })], { alignment: AlignmentType.CENTER })], KOLOM_ISI[2]),
        ],
      }),
      barisKosong(KOLOM_ISI),
      barisBerlabel('Kepada', [
        paragraf([teks('PARA PERSONEL POLRI POLRES CIMAHI YANG NAMA, PANGKAT DAN JABATANNYA TERLAMPIR DALAM SURAT PERINTAH INI.')], {
          alignment: AlignmentType.JUSTIFIED,
        }),
      ], KOLOM_ISI),
      barisKosong(KOLOM_ISI),
      barisBerlabel('Untuk', daftarBernomor(sprin.untuk ?? []), KOLOM_ISI),
    ],
  })

  const blokTtd = new Table({
    width: { size: LEBAR_ISI_SURAT, type: WidthType.DXA },
    columnWidths: KOLOM_TTD,
    borders: TANPA_GARIS,
    rows: [
      new TableRow({
        children: [
          new TableCell({ borders: TANPA_GARIS, width: { size: KOLOM_TTD[0], type: WidthType.DXA }, children: [paragraf([teks('')])] }),
          new TableCell({
            borders: TANPA_GARIS,
            width: { size: KOLOM_TTD[1], type: WidthType.DXA },
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
    // Margin mengikuti dokumen Sprin asli persis: atas 1,25cm / bawah 0,5cm /
    // kiri 2cm / kanan 1,5cm. Nilai ini jugalah yang membuat INDENT_KOP (5155
    // twip di bawah) pas menempel di lebar teks "KEPOLISIAN NEGARA REPUBLIK
    // INDONESIA" -- dengan margin yang salah sebelumnya, garis border kop jadi
    // kelihatan kepanjangan/over dari teksnya.
    properties: {
      page: { size: { width: 11906, height: 16838 }, margin: MARGIN_SURAT },
      // Halaman 1 sudah punya kop lengkap di badan surat -- header berulang di
      // bawah cuma perlu muncul mulai halaman 2 kalau Dasar/Untuk panjang.
      titlePage: true,
    },
    headers: {
      // Header halaman 2 dst: no. halaman di kiri + tabel 3 baris (judul,
      // nomor, tanggal) bergaris pemisah horizontal saja (tanpa garis luar/
      // vertikal). Nilai NOMOR/TANGGAL dibuat rata kiri-kanan per huruf
      // (distribute) supaya melebar rapi mengisi penuh lebar kolomnya.
      // Ditarik rata kanan, lebar cuma separuh halaman (berhenti sekitar
      // tengah) -- bukan selebar penuh margin.
      default: (() => {
        const LEBAR_HEADER_SURAT = Math.round(LEBAR_ISI_SURAT / 2)
        const KOLOM_HEADER = skalakanLebar([450, 1300, 350, 6950], LEBAR_HEADER_SURAT)
        const TANPA_GARIS_LUAR = {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
          insideVertical: { style: BorderStyle.NONE },
        }
        const cellHeader = (children, opts = {}) => new TableCell({ margins: { top: 20, bottom: 20, left: 40, right: 40 }, verticalAlign: 'center', ...opts, children })
        const nilai = (t) => paragraf([teks(t, { size: 20 })], { alignment: AlignmentType.DISTRIBUTE })
        const kosongHeader = () => cellHeader([paragraf([teks('')])])
        return new Header({
          children: [
            new Table({
              alignment: AlignmentType.RIGHT,
              width: { size: LEBAR_HEADER_SURAT, type: WidthType.DXA },
              columnWidths: KOLOM_HEADER,
              borders: TANPA_GARIS_LUAR,
              rows: [
                new TableRow({
                  children: [
                    cellHeader(
                      [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })],
                        }),
                      ],
                      { rowSpan: 4, verticalAlign: 'top', margins: { top: 20, bottom: 20, left: 40, right: 220 } },
                    ),
                    cellHeader([paragraf([teks('SURAT PERINTAH KAPOLRES CIMAHI', { size: 20 })], { alignment: AlignmentType.DISTRIBUTE })], {
                      columnSpan: 3,
                      width: { size: KOLOM_HEADER[1] + KOLOM_HEADER[2] + KOLOM_HEADER[3], type: WidthType.DXA },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    cellHeader([paragraf([teks('NOMOR', { size: 20 })])]),
                    cellHeader([paragraf([teks(':', { size: 20 })], { alignment: AlignmentType.CENTER })]),
                    cellHeader([nilai(sprin.nomorLengkap)]),
                  ],
                }),
                new TableRow({
                  children: [
                    cellHeader([paragraf([teks('TANGGAL', { size: 20 })])]),
                    cellHeader([paragraf([teks(':', { size: 20 })], { alignment: AlignmentType.CENTER })]),
                    cellHeader([nilai(tanggalPanjang(sprin.tanggalMulai).toUpperCase())]),
                  ],
                }),
                new TableRow({
                  children: [kosongHeader(), kosongHeader(), kosongHeader()],
                }),
              ],
            }),
          ],
        })
      })(),
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
