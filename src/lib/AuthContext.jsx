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

  return (
    <AuthContext.Provider value={{ session, profil, sedangMemuat, keluar }}>
      {children}
    </AuthContext.Provider>
  )
}
