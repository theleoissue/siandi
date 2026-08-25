import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { ambilProfilSaya, keluar, AuthContext } from './auth'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = belum dicek, null = tidak login
  const [profil, setProfil] = useState(null)
  const [memuatProfil, setMemuatProfil] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setProfil(null)
      return
    }
    let dibatalkan = false
    setMemuatProfil(true)
    ambilProfilSaya(session.user.id).then(({ data, error }) => {
      if (dibatalkan) return
      setProfil(error ? null : data)
      setMemuatProfil(false)
    })
    return () => {
      dibatalkan = true
    }
  }, [session])

  const sedangMemuat = session === undefined || (Boolean(session) && memuatProfil)

  // Dipanggil manual setelah daftar() -- signUp() memicu fetch profil di atas
  // lebih cepat dari tautkan_akun_baru() selesai (race), jadi hasil pertama
  // sering masih null. Perlu ditarik ulang begitu link-nya benar-benar selesai.
  // Ambil session langsung dari SDK (bukan dari state `session` di closure) --
  // fungsi ini dipanggil di render yang sama dengan daftar(), sebelum React
  // sempat re-render dan memperbarui `session`, jadi closure-nya masih basi.
  async function muatUlangProfil() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return
    setMemuatProfil(true)
    const { data: profilBaru, error } = await ambilProfilSaya(data.session.user.id)
    setProfil(error ? null : profilBaru)
    setMemuatProfil(false)
  }

  return (
    <AuthContext.Provider value={{ session, profil, sedangMemuat, keluar, muatUlangProfil }}>
      {children}
    </AuthContext.Provider>
  )
}
