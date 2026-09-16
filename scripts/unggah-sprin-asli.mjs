// Skrip SEKALI JALAN: unggah 38 PDF Sprin asli (hasil scan dokumen fisik) ke
// Supabase Storage bucket "sprin-asli", lalu tautkan tiap file ke baris
// surat_perintah yang sesuai lewat kolom file_asli_path.
//
// Jalankan SETELAH migrasi 20260916000001_file_asli_sprin.sql dijalankan di
// Supabase SQL Editor (bucket + kolom + RLS storage harus sudah ada).
//
// Cara pakai (dari root project ini):
//   node scripts/unggah-sprin-asli.mjs
// lalu ikuti prompt NRP + kata sandi akun Bag Ops/Admin Anda sendiri --
// skrip ini TIDAK menyimpan kredensial ke mana pun, cuma dipakai sekali untuk
// login lewat Supabase Auth di komputer Anda sendiri.
//
// Pemetaan nama file -> nomor_agenda di bawah ini sudah dicocokkan manual
// dengan isi "Nomor :" yang tercetak di tiap PDF (bukan tebakan dari nama
// file), supaya tidak salah tautkan dokumen.

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import path from 'node:path'

const ROOT_PDF = 'C:\\Database SPRIN SIandi'

const PEMETAAN = [
  // ---------- PART 1 ----------
  ['PART 1/12.08.2026 SPRIN KRYD.pdf', 1819],
  ['PART 1/13.08.2026 SPRIN KRYD.pdf', 1827],
  ['PART 1/14.08.2026  SPRIN KRYD.pdf', 1836],
  ['PART 1/15.08.2026 SPRIN KRYD.pdf', 1835],
  ['PART 1/15.08.2026 SPRIN PAM CARNAVAL PARONGPONG.pdf', 1833],
  ['PART 1/16.08.2026 SPRIN KRYD.pdf', 1844],
  ['PART 1/17.08.2026 SPRIN KRYD.pdf', 1850],
  ['PART 1/17.08.2026 SPRIN PAM PANGGUNG RAKYAT HUT RI (PAN).pdf', 1845],
  ['PART 1/18.08.2026 SPRIN KRYD.pdf', 1854],
  ['PART 1/18.08.2026 SPRIN PAM NOBAR PERSIB VS BALI UNITED.pdf', 1848],
  ['PART 1/19.08.2026 SPRIN KRYD.pdf', 1867],
  ['PART 1/20.08.2026 SPRIN KRYD.pdf', 1883],
  // ---------- PART 2 ----------
  ['PART 2/04.09.2026 SPRIN GATUR POLRES & POLSEK JJRN SEPT 2026.pdf', 2068],
  ['PART 2/22.08.26 SPRIN PAM RW3 FEST BRIGIF.pdf', 1893],
  ['PART 2/22.08.2026 SPRIN KRYD.pdf', 1890],
  ['PART 2/26.08.2026 SPRIN GATUR POLRES & POLSEK JJRN AGUSTUS 2026.pdf', 1903],
  ['PART 2/26.08.2026 SPRIN SIAGA OPSNAL.pdf', 1904],
  ['PART 2/27.08.2026 SPRIN GATUR POLRES & POLSEK JJRN AGUSTUS 2026.pdf', 1907],
  ['PART 2/27.08.2026 SPRIN PAM UNRAS PT NAMASINDO.pdf', 1908],
  ['PART 2/27.08.2026 SPRIN SIAGA OPSNAL.pdf', 1909],
  ['PART 2/28.08.2026 SPRIN GATUR POLRES & POLSEK JJRN AGUSTUS 2026.pdf', 1912],
  ['PART 2/28.08.2026 SPRIN PEMBERANGKATAN MASSA FPI.pdf', 1923],
  ['PART 2/29.08.26 SPRIN PAM BANDUNG ULTRA 2026.pdf', 1916],
  ['PART 2/29.08.26 SPRIN PAM MUSIK FORESTRA 2026.pdf', 1917],
  ['PART 2/KRYD MINGGUAN 05.09.2026.pdf', 2077],
  ['PART 2/SPRIN DALMAS POLRES CIMAHI.pdf', 1914],
  ['PART 2/SPRIN SUPERVISI OPS LIBAS LODAYA 2026.pdf', 1981],
  // ---------- part 3 (berisi Sprin part3 + part4 impor) ----------
  ['part 3/07.09.2026 SPRIN GATUR POLRES & POLSEK JJRN SEPT 2026.pdf', 2080],
  ['part 3/07.09.2026 SPRIN UNRAS DPRD & PEMKAB KBB.pdf', 2081],
  ['part 3/09.09.2026 SPRIN LATIHAN SISPAM KOTA RAYON BANDUNG RAYA - POLRES CIMAHI.pdf', 2086],
  ['part 3/10.09.2026 SPRIN PAM PEMBERANGKATAN SPSB KE KANTOR DPRD PROV JABAR.pdf', 2096],
  ['part 3/11.09.2026 SPRIN GATUR POLRES & POLSEK JJRN SEPT 2026.pdf', 2098],
  ['part 3/11.09.2026 SPRIN PAM PENYALURAN BAHAN PANGAN OLEH ANGGOTA DPR RI KOMISI IV.pdf', 2100],
  ['part 3/12-13.09.2026 SPRIN PAM BCA EXPO.pdf', 2103],
  ['part 3/12.09.2026 SPRIN PAM NOBAR DAN PASCA PERTANDINGAN PERSIB VS PERSIJA.pdf', 2110],
  ['part 3/KRYD HARIAN 09.09.2026.pdf', 2094],
  ['part 3/KRYD HARIAN 11.09.2026.pdf', 2099],
  ['part 3/KRYD MINGGUAN 12.09.2026.pdf', 2104],
]

function bacaEnv() {
  const isi = readFileSync(path.resolve('.env'), 'utf8')
  const env = {}
  for (const baris of isi.split('\n')) {
    const m = baris.match(/^([A-Z_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

async function main() {
  const env = bacaEnv()
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const nrp = await rl.question('NRP: ')
  const password = await rl.question('Kata sandi: ')
  rl.close()

  const { data: sess, error: loginErr } = await supabase.auth.signInWithPassword({
    email: `nrp${nrp}@siandi.app`,
    password,
  })
  if (loginErr) {
    console.error('Gagal login:', loginErr.message)
    process.exit(1)
  }
  console.log('Login sukses sebagai', sess.user.email)

  let berhasil = 0
  let gagal = 0
  for (const [relPath, nomorAgenda] of PEMETAAN) {
    const fullPath = path.join(ROOT_PDF, relPath)
    if (!existsSync(fullPath)) {
      console.log('SKIP (file tidak ada):', fullPath)
      gagal++
      continue
    }
    const bytes = readFileSync(fullPath)
    const storagePath = `${nomorAgenda}.pdf`

    // upsert:true sengaja TIDAK dipakai -- kombinasinya dengan RLS storage
    // custom di project ini bikin request ditolak walau izinnya sebenarnya
    // benar (upsert memicu jalur SQL berbeda di storage-api). Karena ini
    // upload pertama kali per file, insert biasa sudah cukup; kalau skrip
    // diulang dan filenya sudah ada, error "sudah ada" dianggap sukses (skip).
    const { error: upErr } = await supabase.storage
      .from('sprin-asli')
      .upload(storagePath, bytes, { contentType: 'application/pdf' })
    if (upErr && !/already exists|Duplicate/i.test(upErr.message)) {
      console.log('GAGAL upload nomor', nomorAgenda, '-', upErr.message)
      gagal++
      continue
    }
    if (upErr) {
      console.log('Sudah pernah terunggah, lanjut tautkan saja:', nomorAgenda)
    }

    // Lewat RPC (bukan update langsung) -- surat_perintah cuma punya policy
    // UPDATE untuk alur draf/persetujuan, tidak untuk menautkan arsip ke
    // Sprin yang sudah Terbit.
    const { error: dbErr } = await supabase.rpc('tetapkan_file_asli_sprin', {
      p_nomor_agenda: nomorAgenda,
      p_file_asli_path: storagePath,
    })
    if (dbErr) {
      console.log('GAGAL tautkan nomor', nomorAgenda, '-', dbErr.message)
      gagal++
      continue
    }
    console.log('OK', nomorAgenda, '->', storagePath)
    berhasil++
  }

  console.log(`\nSelesai. Berhasil: ${berhasil}, gagal/skip: ${gagal}, total: ${PEMETAAN.length}`)
}

main()
