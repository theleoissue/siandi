import { useMemo } from 'react'
import TabelSprin from '../components/TabelSprin'
import { useSprinStore } from '../lib/SprinStore'

export default function Persetujuan() {
  const { daftar } = useSprinStore()
  const menunggu = useMemo(() => daftar.filter((s) => s.status === 'Menunggu Persetujuan'), [daftar])

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Persetujuan
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Draf yang menunggu diperiksa dan disahkan.
        </p>
      </div>

      {menunggu.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center text-sm"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA', color: '#67788C' }}
        >
          Tidak ada draf yang menunggu.
        </div>
      ) : (
        <TabelSprin daftar={menunggu} pesanKosong="Tidak ada draf yang menunggu." />
      )}
    </main>
  )
}
