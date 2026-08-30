import { supabase } from './supabase'
import { rumpunDariKode } from './jenisKegiatanApi'

// CRUD data template jenis kegiatan untuk halaman "Kelola Jenis Kegiatan".
// Izin ubah dibatasi RLS (Kasubbag Binops / Paurmin / Staf Admin).

// Ambil semua jenis kegiatan lengkap dengan data baku-nya, terkelompok OPS/PAM.
export async function ambilSemuaJenisKelola() {
  const { data: jenis, error } = await supabase
    .from('jenis_kegiatan')
    .select('id, nama, kode_klasifikasi, perkiraan_durasi_jam, wajib_isi_durasi_manual')
    .order('kode_klasifikasi')
  if (error) throw error

  const hasil = []
  for (const jk of jenis ?? []) {
    const [kel, dasar, untuk] = await Promise.all([
      supabase.from('jenis_kegiatan_kelompok').select('id, nama_kelompok, sifat, urutan_tampil').eq('jenis_kegiatan_id', jk.id).order('urutan_tampil'),
      supabase.from('jenis_kegiatan_dasar_hukum').select('urutan, dasar_hukum_baku ( teks )').eq('jenis_kegiatan_id', jk.id).order('urutan'),
      supabase.from('jenis_kegiatan_untuk_baku').select('teks, urutan').eq('jenis_kegiatan_id', jk.id).order('urutan'),
    ])
    hasil.push({
      id: jk.id,
      nama: jk.nama,
      kode: jk.kode_klasifikasi,
      perkiraanJam: jk.perkiraan_durasi_jam,
      wajibDurasiManual: jk.wajib_isi_durasi_manual,
      rumpun: rumpunDariKode(jk.kode_klasifikasi),
      kelompok: (kel.data ?? []).map((k) => ({ nama: k.nama_kelompok, sifat: k.sifat === 'PENGENDALI' ? 'pengendali' : 'pelaksana' })),
      dasar: (dasar.data ?? []).map((d) => d.dasar_hukum_baku?.teks).filter(Boolean),
      untuk: (untuk.data ?? []).map((u) => u.teks),
    })
  }
  return hasil
}

// BR-06: setiap jenis kegiatan wajib punya salah satu -- perkiraan durasi baku
// ATAU ditandai wajib diisi manual. Kombinasi "bukan wajib manual, tapi juga
// tidak ada perkiraan jam" bikin field durasi tidak pernah bisa terisi sama
// sekali di Buat Sprin (tidak wajib manual -> input tidak muncul; tidak ada
// baku -> tidak ada nilai default). Divalidasi di sini, bukan cuma di UI form,
// supaya tidak bisa lolos lewat panggilan API langsung juga.
function validasiDurasi({ perkiraanJam, wajibDurasiManual }) {
  if (!wajibDurasiManual && !perkiraanJam) {
    throw new Error('Isi perkiraan durasi (jam), atau centang "durasi diisi manual" kalau jenis ini tidak punya durasi baku.')
  }
}

export async function tambahJenisKegiatan({ nama, kode, perkiraanJam, wajibDurasiManual }) {
  validasiDurasi({ perkiraanJam, wajibDurasiManual })
  const { data, error } = await supabase
    .from('jenis_kegiatan')
    .insert({
      nama: nama.trim(),
      kode_klasifikasi: kode.trim(),
      perkiraan_durasi_jam: wajibDurasiManual ? null : (perkiraanJam || null),
      wajib_isi_durasi_manual: Boolean(wajibDurasiManual),
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function ubahJenisKegiatan(id, { nama, kode, perkiraanJam, wajibDurasiManual }) {
  validasiDurasi({ perkiraanJam, wajibDurasiManual })
  const { error } = await supabase
    .from('jenis_kegiatan')
    .update({
      nama: nama.trim(),
      kode_klasifikasi: kode.trim(),
      perkiraan_durasi_jam: wajibDurasiManual ? null : (perkiraanJam || null),
      wajib_isi_durasi_manual: Boolean(wajibDurasiManual),
    })
    .eq('id', id)
  if (error) throw error
}

export async function hapusJenisKegiatan(id) {
  const { error } = await supabase.from('jenis_kegiatan').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') throw new Error('Jenis ini masih dipakai oleh Sprin yang sudah ada, tidak bisa dihapus.')
    throw error
  }
}

// Ganti seluruh kelompok baku suatu jenis (hapus lalu isi ulang sesuai urutan).
export async function simpanKelompokBaku(jenisId, daftar) {
  const del = await supabase.from('jenis_kegiatan_kelompok').delete().eq('jenis_kegiatan_id', jenisId)
  if (del.error) throw del.error
  if (daftar.length === 0) return
  const baris = daftar.map((k, i) => ({
    jenis_kegiatan_id: jenisId,
    nama_kelompok: k.nama.trim(),
    sifat: k.sifat === 'pengendali' ? 'PENGENDALI' : 'PELAKSANA',
    kunci_penuh_durasi: k.sifat === 'pengendali',
    urutan_tampil: i,
  }))
  const ins = await supabase.from('jenis_kegiatan_kelompok').insert(baris)
  if (ins.error) throw ins.error
}

export async function simpanUntukBaku(jenisId, daftarTeks) {
  const del = await supabase.from('jenis_kegiatan_untuk_baku').delete().eq('jenis_kegiatan_id', jenisId)
  if (del.error) throw del.error
  const teks = daftarTeks.map((t) => t.trim()).filter(Boolean)
  if (teks.length === 0) return
  const ins = await supabase
    .from('jenis_kegiatan_untuk_baku')
    .insert(teks.map((t, i) => ({ jenis_kegiatan_id: jenisId, teks: t, urutan: i })))
  if (ins.error) throw ins.error
}

// Dasar hukum baku dipakai bersama antar jenis. Untuk tiap teks: pastikan ada di
// dasar_hukum_baku (buat kalau belum), lalu susun ulang relasinya untuk jenis ini.
export async function simpanDasarBaku(jenisId, daftarTeks) {
  const teks = daftarTeks.map((t) => t.trim()).filter(Boolean)

  const del = await supabase.from('jenis_kegiatan_dasar_hukum').delete().eq('jenis_kegiatan_id', jenisId)
  if (del.error) throw del.error
  if (teks.length === 0) return

  // Cari yang sudah ada, buat yang belum.
  const { data: adaData, error: adaErr } = await supabase.from('dasar_hukum_baku').select('id, teks').in('teks', teks)
  if (adaErr) throw adaErr
  const petaTeksKeId = new Map((adaData ?? []).map((d) => [d.teks, d.id]))
  const belumAda = teks.filter((t) => !petaTeksKeId.has(t))
  if (belumAda.length > 0) {
    const { data: baru, error: baruErr } = await supabase
      .from('dasar_hukum_baku')
      .insert(belumAda.map((t) => ({ teks: t, jenis: 'PERATURAN_LAIN' })))
      .select('id, teks')
    if (baruErr) throw baruErr
    for (const d of baru ?? []) petaTeksKeId.set(d.teks, d.id)
  }

  const baris = teks.map((t, i) => ({ jenis_kegiatan_id: jenisId, dasar_hukum_baku_id: petaTeksKeId.get(t), urutan: i }))
  const ins = await supabase.from('jenis_kegiatan_dasar_hukum').insert(baris)
  if (ins.error) throw ins.error
}
