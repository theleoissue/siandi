import { createContext, useContext } from 'react'
import { supabase } from './supabase'

export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}

// Supabase Auth cuma mengenal email+password secara native. User login/daftar
// pakai NRP (sesuai mockup, "Nomor Registrasi Pokok"), jadi NRP disintesis jadi
// email di balik layar -- tidak pernah terlihat/diketik user. ".local"/".internal"
// ditolak validasi email Supabase (sudah diuji), makanya pakai ".app".
const DOMAIN_SINTESIS = 'siandi.app'

export function emailDariNrp(nrp) {
  return `nrp${nrp}@${DOMAIN_SINTESIS}`
}

export async function masuk(nrp, password) {
  const { error } = await supabase.auth.signInWithPassword({ email: emailDariNrp(nrp), password })
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('NRP atau kata sandi salah.')
    }
    throw error
  }
}

export async function daftar(nrp, password) {
  const { data: tersedia, error: cekError } = await supabase.rpc('nrp_tersedia_untuk_registrasi', { p_nrp: nrp })
  if (cekError) throw cekError
  if (!tersedia) {
    throw new Error('NRP tidak ditemukan di data personel, tidak aktif, atau sudah pernah didaftarkan.')
  }

  const { error: signUpError } = await supabase.auth.signUp({ email: emailDariNrp(nrp), password })
  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      throw new Error('NRP ini sudah terdaftar. Silakan masuk.')
    }
    throw signUpError
  }

  const { error: linkError } = await supabase.rpc('tautkan_akun_baru', { p_nrp: nrp })
  if (linkError) throw linkError
}

export async function keluar() {
  await supabase.auth.signOut()
}

export async function ambilProfilSaya(authUserId) {
  return supabase.from('pengguna').select('*').eq('auth_user_id', authUserId).single()
}
