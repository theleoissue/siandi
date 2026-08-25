// Preset contoh diambil dari SIANDI_Mockup_v3.html untuk "Pengamanan Unjuk Rasa"
// (satu-satunya jenis kegiatan yang datanya sudah diverifikasi lengkap dari mockup).
// Jenis kegiatan lain akan mendapat data nyata di tahap "sambungkan data asli" (step 4),
// mengikuti skema jenis_kegiatan / jenis_kegiatan_kelompok / dasar_hukum di PRD.
export const JENIS_KEGIATAN_OPTIONS = [
  'KEGIATAN RUTIN YANG DITINGKATKAN',
  'PENGAMANAN VIP/VVIP',
  'PENGAMANAN UNJUK RASA',
  'OPERASI KEPOLISIAN KEWILAYAHAN',
  'OPERASI KEPOLISIAN HARI BESAR',
]

export const PRESET_UNJUK_RASA = {
  nama: 'PENGAMANAN UNJUK RASA',
  kodeKlasifikasi: 'PAM.3.2.',
  perkiraanJam: 8,
  sumberContoh: 3,
  kelompokBaku: [
    { nama: 'UNSUR PIMPINAN', sifat: 'pengendali' },
    { nama: 'DETEKSI', sifat: 'pelaksana' },
    { nama: 'WAS PERS', sifat: 'pelaksana' },
    { nama: 'NEGOSIATOR', sifat: 'pelaksana' },
    { nama: 'DALMAS AWAL', sifat: 'pelaksana' },
    { nama: 'PAM JALUR', sifat: 'pelaksana' },
    { nama: 'GAKKUM', sifat: 'pelaksana' },
  ],
  dasarHukumBaku: [
    'Undang-Undang Nomor 5 Tahun 2026 tentang perubahan ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;',
    'Perkap Nomor 1 Tahun 2009 tentang Penggunaan Kekuatan dalam Tindakan Kepolisian;',
    'Peraturan Kepala Kepolisian Negara Republik Indonesia Nomor 8 Tahun 2021 tentang Perubahan atas Perkap Nomor 1 Tahun 2019 tentang Sistem, Manajemen dan Standar Keberhasilan Operasional Polri;',
    'Rengiat Polres Cimahi T.A. 2026.',
  ],
  dasarHukumRujukanDiperlukan: {
    kode: 'DH-07',
    keterangan: 'perlu no, bln, thn, tgl, perihal',
    placeholder:
      'Informasi Khusus Sat Intelkam Polres Cimahi Nomor R/Infosus/<no>/<bln>/<thn>/Intelkam tanggal <tgl> tentang <perihal>',
  },
  untukBaku: [
    'melaksanakan kegiatan;',
    'seluruh personel DILARANG MEMBAWA / MENGGUNAKAN SENJATA API dalam pelaksanaan tugas pengamanan;',
    'personel menggunakan pakaian PDL-II Two Tone / menyesuaikan;',
    'melaksanakan Koordinasi dan Komunikasi dengan pihak terkait;',
    'melaksanakan perintah ini dengan saksama dan penuh rasa tanggung jawab;',
    'melaporkan hasil pelaksanaan tugas kepada Ka / Waka / Kabag Ops Polres Cimahi pada kesempatan pertama.',
  ],
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu']
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function formatTanggalIndonesia(isoDate) {
  if (!isoDate) return null
  const d = new Date(isoDate + 'T00:00:00')
  return `${HARI[d.getDay()]} tanggal ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export function bangunButirUntuk(preset, { tanggalMulai, jamApel, apelDipimpinOleh }) {
  const tanggalText = formatTanggalIndonesia(tanggalMulai)
  const butirApel = tanggalText
    ? `apel pengamanan dilaksanakan pada hari ${tanggalText} pukul ${jamApel} WIB dipimpin oleh ${apelDipimpinOleh || '...'};`
    : `apel pengamanan dilaksanakan pada tanggal yang ditentukan pukul ${jamApel} WIB dipimpin oleh ${apelDipimpinOleh || '...'};`
  return [preset.untukBaku[0], butirApel, ...preset.untukBaku.slice(1)]
}
