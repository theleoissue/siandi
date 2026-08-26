import { supabase } from './supabase'

// Preset jenis kegiatan sekarang diambil dari DB (bukan hardcode). Semua jenis
// kegiatan punya kelompok baku + dasar hukum baku + butir "Untuk" baku yang
// diturunkan dari 9 Sprin historis asli Polres Cimahi.

// Placeholder dasar hukum rujukan (butir spesifik yang diketik per-Sprin) --
// beda per jenis karena bentuk rujukannya beda (Infosus Intelkam, Renops, dst).
const RUJUKAN_PER_JENIS = {
  'PENGAMANAN UNJUK RASA': {
    kode: 'DH-07',
    keterangan: 'Informasi Khusus Intelkam (opsional)',
    placeholder:
      'Informasi Khusus Sat Intelkam Polres Cimahi Nomor R/Infosus/<no>/<bln>/<thn>/Intelkam tanggal <tgl> tentang <perihal>',
  },
  'PENGAMANAN VIP/VVIP': {
    kode: 'Rujukan',
    keterangan: 'Informasi Khusus Intelkam (opsional)',
    placeholder:
      'Informasi Khusus Sat Intelkam Polres Cimahi Nomor R/Infosus/<no>/<bln>/<thn>/Intelkam tanggal <tgl> tentang <perihal>',
  },
  'OPERASI KEPOLISIAN HARI BESAR': {
    kode: 'Rujukan',
    keterangan: 'Rencana Operasi / Sprin BKO (opsional)',
    placeholder: 'Rencana Operasi ... Polres Cimahi Nomor R/Renops/<no>/<bln>/<kka>/<thn> tanggal <tgl> tentang <perihal>',
  },
  'OPERASI KEPOLISIAN KEWILAYAHAN': {
    kode: 'Rujukan',
    keterangan: 'Rencana Operasi (opsional)',
    placeholder: 'Rencana Operasi ... Polres Cimahi Nomor R/Renops/<no>/<bln>/<kka>/<thn> tanggal <tgl> tentang <perihal>',
  },
}

// Rumpun kegiatan diturunkan dari awalan kode KKA (OPS.* / PAM.*) sesuai
// KEP/313/V/2010: OPS = Operasi, PAM = Pengamanan. Dipakai untuk mengelompokkan
// daftar jenis kegiatan (Operasi sekelompok, Pengamanan sekelompok).
export function rumpunDariKode(kode) {
  if (!kode) return 'Lainnya'
  if (kode.startsWith('OPS')) return 'Operasi'
  if (kode.startsWith('PAM')) return 'Pengamanan'
  return 'Lainnya'
}

const URUTAN_RUMPUN = { Operasi: 0, Pengamanan: 1, Lainnya: 2 }

export async function ambilDaftarJenisKegiatan() {
  const { data, error } = await supabase
    .from('jenis_kegiatan')
    .select('nama, kode_klasifikasi')
    .order('kode_klasifikasi')
  if (error) throw error
  return (data ?? [])
    .map((j) => ({ nama: j.nama, kode: j.kode_klasifikasi, rumpun: rumpunDariKode(j.kode_klasifikasi) }))
    .sort((a, b) =>
      URUTAN_RUMPUN[a.rumpun] - URUTAN_RUMPUN[b.rumpun] || a.kode.localeCompare(b.kode) || a.nama.localeCompare(b.nama),
    )
}

export async function ambilPresetJenisKegiatan(nama) {
  const { data: jk, error: jkErr } = await supabase
    .from('jenis_kegiatan')
    .select('id, nama, kode_klasifikasi, perkiraan_durasi_jam, wajib_isi_durasi_manual')
    .eq('nama', nama)
    .maybeSingle()
  if (jkErr) throw jkErr
  if (!jk) return null

  const [kelompok, dasar, untuk] = await Promise.all([
    supabase
      .from('jenis_kegiatan_kelompok')
      .select('nama_kelompok, sifat, urutan_tampil')
      .eq('jenis_kegiatan_id', jk.id)
      .order('urutan_tampil'),
    supabase
      .from('jenis_kegiatan_dasar_hukum')
      .select('urutan, dasar_hukum_baku ( teks )')
      .eq('jenis_kegiatan_id', jk.id)
      .order('urutan'),
    supabase
      .from('jenis_kegiatan_untuk_baku')
      .select('teks, urutan')
      .eq('jenis_kegiatan_id', jk.id)
      .order('urutan'),
  ])
  if (kelompok.error) throw kelompok.error
  if (dasar.error) throw dasar.error
  if (untuk.error) throw untuk.error

  return {
    nama: jk.nama,
    kodeKlasifikasi: jk.kode_klasifikasi,
    perkiraanJam: jk.perkiraan_durasi_jam,
    wajibDurasiManual: jk.wajib_isi_durasi_manual,
    kelompokBaku: (kelompok.data ?? []).map((k) => ({
      nama: k.nama_kelompok,
      sifat: k.sifat === 'PENGENDALI' ? 'pengendali' : 'pelaksana',
    })),
    dasarHukumBaku: (dasar.data ?? []).map((d) => d.dasar_hukum_baku?.teks).filter(Boolean),
    untukBaku: (untuk.data ?? []).map((u) => u.teks),
    dasarHukumRujukanDiperlukan: RUJUKAN_PER_JENIS[jk.nama] ?? {
      kode: 'Rujukan',
      keterangan: 'dasar hukum rujukan (opsional)',
      placeholder: 'Ketik dasar hukum rujukan khusus Sprin ini bila ada',
    },
  }
}
