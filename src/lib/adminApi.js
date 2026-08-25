import { supabase } from './supabase'

// Reset password akun lain (STAF_ADMIN saja) -- lewat SECURITY DEFINER
// function di database (reset_password_staf_admin), bukan Edge Function.
// Pengecekan role dilakukan di dalam SQL function itu sendiri.
export async function resetPasswordAkunLain(nrp, passwordBaru) {
  const { error } = await supabase.rpc('reset_password_staf_admin', {
    p_nrp: nrp,
    p_password_baru: passwordBaru,
  })
  if (error) throw new Error(error.message)
}

export async function ambilDaftarAkun() {
  const { data, error } = await supabase
    .from('pengguna')
    .select('id, nama, nrp, pangkat, peran_sistem, satuan_fungsi, status_aktif, auth_user_id')
    .not('auth_user_id', 'is', null)
    .order('peran_sistem')
  if (error) throw error
  return data ?? []
}
