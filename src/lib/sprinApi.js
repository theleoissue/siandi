import { supabase } from './supabase'
import { labelWaktu } from './format'

// Lapisan data asli untuk SprinStore -- menggantikan data contoh in-memory.
// Field pada objek yang dikembalikan sengaja dipertahankan sama persis dengan
// bentuk lama (camelCase, label bahasa Indonesia) supaya halaman-halaman yang
// sudah ada (DaftarSprin, Arsip, SprinDetail, dst.) tidak perlu diubah.

const LABEL_STATUS = {
  DRAF: 'Draf',
  MENUNGGU_PERSETUJUAN: 'Menunggu Persetujuan',
  DISETUJUI: 'Terbit', // BR-16: tidak pernah benar-benar tersimpan, langsung jadi TERBIT
  TERBIT: 'Terbit',
  DIKEMBALIKAN: 'Dikembalikan',
}

function petaPersonel(sp) {
  const sumber = sp.pengguna ?? sp.personel_non_kuatpers
  return {
    nama: sumber?.nama ?? '(tidak diketahui)',
    pangkat: sumber?.pangkat ?? null,
    nrp: sumber?.nrp ?? null,
    jabatanStruktur: sumber?.jabatan_struktur ?? sumber?.jabatan_asal ?? null,
    jabatanOperasional: sp.jabatan_operasional,
  }
}

function petaSprin(row) {
  const kelompok = (row.sprin_kelompok ?? [])
    .slice()
    .sort((a, b) => a.urutan - b.urutan)
    .map((k) => ({
      nama: k.nama_kelompok,
      kelompokBesar: k.kelompok_besar,
      sifat: k.sifat === 'PENGENDALI' ? 'pengendali' : 'pelaksana',
      personel: (k.sprin_personel ?? [])
        .slice()
        .sort((a, b) => a.nomor_urut_kelompok - b.nomor_urut_kelompok)
        .map(petaPersonel),
    }))
  const jumlahPersonel = kelompok.reduce((acc, k) => acc + k.personel.length, 0)
  const dasar = (row.sprin_dasar_hukum_baku ?? [])
    .slice()
    .sort((a, b) => a.urutan - b.urutan)
    .map((d) => d.dasar_hukum_baku?.teks)
    .filter(Boolean)

  return {
    id: row.id,
    nomorLengkap: row.nomor_lengkap,
    perihal: row.perihal,
    pertimbangan: row.pertimbangan,
    lokasi: row.lokasi,
    dasar: dasar.length > 0 ? dasar : undefined,
    untuk: row.butir_untuk ?? undefined,
    jenisKegiatanNama: row.jenis_kegiatan?.nama,
    kodeKlasifikasi: row.jenis_kegiatan?.kode_klasifikasi,
    tanggalMulai: row.tanggal_mulai,
    tanggalSelesai: row.tanggal_selesai,
    jamApel: row.jam_apel ? row.jam_apel.slice(0, 5) : null,
    waktuLabel: labelWaktu({ tanggalMulai: row.tanggal_mulai, tanggalSelesai: row.tanggal_selesai, jamApel: row.jam_apel?.slice(0, 5) }),
    status: LABEL_STATUS[row.status] ?? row.status,
    catatanPemeriksaan: row.catatan_pemeriksaan,
    jumlahPersonel,
    jumlahKelompok: kelompok.length,
    kelompok,
    // Sprin arsip historis tidak punya pertimbangan/dasar/untuk tersimpan (belum
    // diambil dari sumber saat migrasi) -- detailLengkap jadi penanda untuk itu.
    // "dasar" dan "untuk" sengaja tidak diisi di sini karena belum ada kolom/tabel
    // untuk menyimpannya (lihat catatan BR-03 di jenisKegiatanPreset.js).
    detailLengkap: Boolean(row.pertimbangan),
  }
}

const SELECT_SPRIN_LENGKAP = `
  id, nomor_lengkap, perihal, pertimbangan, lokasi, tanggal_mulai, tanggal_selesai,
  jam_apel, status, catatan_pemeriksaan, butir_untuk,
  jenis_kegiatan:jenis_kegiatan_id ( nama, kode_klasifikasi ),
  sprin_dasar_hukum_baku ( urutan, dasar_hukum_baku ( teks ) ),
  sprin_kelompok (
    id, nama_kelompok, kelompok_besar, sifat, urutan,
    sprin_personel (
      id, nomor_urut_kelompok, jabatan_operasional,
      pengguna ( nama, pangkat, nrp, jabatan_struktur ),
      personel_non_kuatpers ( nama, pangkat, nrp, jabatan_asal )
    )
  )
`

// BR-01: nomor agenda diusulkan dari nomor tertinggi tercatat + 1 -- field
// tetap bisa disunting manual di form supaya bisa disinkronkan ke buku agenda
// fisik kalau berbeda.
export async function ambilUsulanNomorAgenda() {
  const { data, error } = await supabase
    .from('surat_perintah')
    .select('nomor_agenda')
    .order('nomor_agenda', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data?.nomor_agenda ?? 0) + 1
}

export async function ambilDaftarSprin() {
  const { data, error } = await supabase
    .from('surat_perintah')
    .select(SELECT_SPRIN_LENGKAP)
    .order('tanggal_mulai', { ascending: false })
  if (error) throw error
  return (data ?? []).map(petaSprin)
}

export async function ambilLogAktivitas() {
  const { data, error } = await supabase
    .from('log_aktivitas')
    .select('id, aksi, detail, created_at, surat_perintah(nomor_lengkap), pengguna(nama, pangkat)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(petaLog)
}

function formatWaktuLog(iso) {
  const d = new Date(iso)
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())} ${bulan[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function petaLog(row) {
  const nomor = row.surat_perintah?.nomor_lengkap ?? ''
  const jumlahBentrok = Array.isArray(row.detail) ? row.detail.length : 0
  const teks = {
    TERBIT_OTOMATIS: `Menerbitkan ${nomor}`,
    DIKEMBALIKAN: `Mengembalikan ${nomor}`,
    PENERUSAN_BENTROK: `Meneruskan ${nomor} meski ada ${jumlahBentrok} peringatan bentrok`,
  }
  const warna = { TERBIT_OTOMATIS: '#1F7A4D', DIKEMBALIKAN: '#B3261E', PENERUSAN_BENTROK: '#8A6100' }
  return {
    id: row.id,
    aksi: (teks[row.aksi] ?? row.aksi).trim(),
    pelaku: row.pengguna ? [row.pengguna.pangkat, row.pengguna.nama].filter(Boolean).join(' ') : 'Sistem',
    waktuLabel: formatWaktuLog(row.created_at),
    warna: warna[row.aksi] ?? '#67788C',
  }
}

export async function ambilNotifikasi() {
  const { data, error } = await supabase
    .from('notifikasi')
    .select('id, dibaca, dikirim_pada, surat_perintah_id, surat_perintah(nomor_lengkap, perihal)')
    .order('dikirim_pada', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    sprinId: row.surat_perintah_id,
    dibaca: row.dibaca,
    perihal: row.surat_perintah?.perihal,
    nomorLengkap: row.surat_perintah?.nomor_lengkap,
  }))
}

export async function tandaiNotifikasiDibacaDb(id) {
  const { error } = await supabase.from('notifikasi').update({ dibaca: true }).eq('id', id)
  if (error) throw error
}

export async function pengunaIdSaya() {
  const { data, error } = await supabase.rpc('pengguna_id_saya')
  if (error) throw error
  return data
}

export async function ajukanSprinDb(data) {
  const pgId = await pengunaIdSaya()

  const { data: jk, error: jkErr } = await supabase
    .from('jenis_kegiatan')
    .select('id')
    .eq('nama', data.jenisKegiatanNama)
    .single()
  if (jkErr) throw jkErr

  const { data: sp, error: spErr } = await supabase
    .from('surat_perintah')
    .insert({
      nomor_agenda: Number(data.nomorAgenda),
      jenis_kegiatan_id: jk.id,
      perihal: data.perihal,
      pertimbangan: data.pertimbangan,
      lokasi: data.lokasi,
      tanggal_mulai: data.tanggalMulai,
      tanggal_selesai: data.tanggalSelesai,
      jam_apel: data.jamApel || null,
      status: 'MENUNGGU_PERSETUJUAN',
      disusun_oleh: pgId,
      butir_untuk: data.butirUntuk ?? null,
    })
    .select('id')
    .single()
  if (spErr) throw spErr

  // BR-03: dasar hukum baku untuk jenis kegiatan ini -- dicocokkan lewat teks
  // persis (dasar_hukum_baku belum punya kolom jenis_kegiatan_id di skema saat
  // ini, jadi belum ada cara relasional untuk "dasar hukum milik jenis X").
  if (data.dasarHukumBaku?.length > 0) {
    const { data: dasarCocok, error: dhErr } = await supabase
      .from('dasar_hukum_baku')
      .select('id, teks')
      .in('teks', data.dasarHukumBaku)
    if (dhErr) throw dhErr
    const petaTeksKeId = new Map((dasarCocok ?? []).map((d) => [d.teks, d.id]))
    const barisDasar = data.dasarHukumBaku
      .map((teks, i) => ({ dasar_hukum_baku_id: petaTeksKeId.get(teks), urutan: i }))
      .filter((b) => b.dasar_hukum_baku_id)
      .map((b) => ({ ...b, surat_perintah_id: sp.id }))
    if (barisDasar.length > 0) {
      const { error: sdhErr } = await supabase.from('sprin_dasar_hukum_baku').insert(barisDasar)
      if (sdhErr) throw sdhErr
    }
  }

  const { data: kelompokBaru, error: skErr } = await supabase
    .from('sprin_kelompok')
    .insert(
      data.kelompok.map((k, i) => ({
        surat_perintah_id: sp.id,
        nama_kelompok: k.nama,
        kelompok_besar: k.kelompokBesar || null,
        sifat: k.sifat === 'pengendali' ? 'PENGENDALI' : 'PELAKSANA',
        urutan: i,
      })),
    )
    .select('id')
  if (skErr) throw skErr

  const semuaNrp = [...new Set(data.kelompok.flatMap((k) => k.personel.filter((p) => !p.nonKuatpers).map((p) => p.nrp)))]
  const { data: penggunaCocok, error: pgErr } = await supabase
    .from('pengguna')
    .select('id, nrp')
    .in('nrp', semuaNrp.length > 0 ? semuaNrp : [''])
  if (pgErr) throw pgErr
  const petaNrpKeId = new Map((penggunaCocok ?? []).map((pg) => [pg.nrp, pg.id]))

  // BR-05/BR-13: personel yang tidak ketemu di KUATPERS masuk lewat jalur
  // manual -- baris personel_non_kuatpers-nya dibuat dulu di sini supaya
  // sprin_personel bisa mengacu ke id yang benar.
  const semuaNonKuatpers = data.kelompok.flatMap((k) => k.personel.filter((p) => p.nonKuatpers))
  const petaTempIdKeId = new Map()
  if (semuaNonKuatpers.length > 0) {
    const { data: nkBaru, error: nkErr } = await supabase
      .from('personel_non_kuatpers')
      .insert(
        semuaNonKuatpers.map((p) => ({
          nama: p.nama,
          nrp: p.nrp || null,
          pangkat: p.pangkat || null,
          jabatan_asal: p.jabatanStruktur || null,
          keterangan: p.keterangan,
          diinput_oleh: pgId,
        })),
      )
      .select('id')
    if (nkErr) throw nkErr
    semuaNonKuatpers.forEach((p, i) => petaTempIdKeId.set(p.tempId, nkBaru[i].id))
  }

  let nomorKeseluruhan = 0
  const barisPersonel = []
  data.kelompok.forEach((k, ki) => {
    k.personel.forEach((p, pi) => {
      const penggunaId = p.nonKuatpers ? null : petaNrpKeId.get(p.nrp)
      const nonKuatpersId = p.nonKuatpers ? petaTempIdKeId.get(p.tempId) : null
      if (!penggunaId && !nonKuatpersId) return // NRP tidak cocok dengan roster pengguna -- lewati
      nomorKeseluruhan += 1
      barisPersonel.push({
        sprin_kelompok_id: kelompokBaru[ki].id,
        pengguna_id: penggunaId,
        personel_non_kuatpers_id: nonKuatpersId,
        nomor_urut_keseluruhan: nomorKeseluruhan,
        nomor_urut_kelompok: pi + 1,
        jabatan_operasional: p.jabatanOperasional ?? null,
      })
    })
  })
  if (barisPersonel.length > 0) {
    const { error: spersErr } = await supabase.from('sprin_personel').insert(barisPersonel)
    if (spersErr) throw spersErr
  }

  // BR-09: penyusun tetap boleh meneruskan draf meski ada peringatan bentrok,
  // tapi setiap penerusan wajib tercatat di log_aktivitas dengan rinciannya.
  if (data.konflikBentrok?.length > 0) {
    const { error: logErr } = await supabase.from('log_aktivitas').insert({
      pengguna_id: pgId,
      surat_perintah_id: sp.id,
      aksi: 'PENERUSAN_BENTROK',
      detail: data.konflikBentrok,
    })
    if (logErr) throw logErr
  }

  return sp.id
}

export async function setujuiSprinDb(id, catatanPemeriksaan) {
  const { error } = await supabase
    .from('surat_perintah')
    .update({ status: 'DISETUJUI', catatan_pemeriksaan: catatanPemeriksaan || null })
    .eq('id', id)
  if (error) throw error
  // Trigger DB (BR-16, BR-14) otomatis: naikkan ke TERBIT, isi disetujui_oleh/pada,
  // kirim notifikasi ke seluruh personel berakun, catat log_aktivitas -- tidak perlu diulang di sini.
}

export async function kembalikanSprinDb(id, catatanPemeriksaan) {
  const { error } = await supabase
    .from('surat_perintah')
    .update({ status: 'DIKEMBALIKAN', catatan_pemeriksaan: catatanPemeriksaan })
    .eq('id', id)
  if (error) throw error
  const pgId = await pengunaIdSaya()
  const { error: logErr } = await supabase
    .from('log_aktivitas')
    .insert({ pengguna_id: pgId, surat_perintah_id: id, aksi: 'DIKEMBALIKAN' })
  if (logErr) throw logErr
}
