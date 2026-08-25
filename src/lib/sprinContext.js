import { createContext, useContext } from 'react'

export const SprinContext = createContext(null)

export const STATUS_BADGE_STYLE = {
  Terbit: { backgroundColor: '#E8F5EE', color: '#1F7A4D' },
  'Menunggu Persetujuan': { backgroundColor: '#FDF6E3', color: '#8A6100' },
  Dikembalikan: { backgroundColor: '#FDECEA', color: '#B3261E' },
  Draf: { backgroundColor: '#EEF1F5', color: '#67788C' },
}

export function useSprinStore() {
  const ctx = useContext(SprinContext)
  if (!ctx) throw new Error('useSprinStore harus dipakai di dalam SprinStoreProvider')
  return ctx
}
