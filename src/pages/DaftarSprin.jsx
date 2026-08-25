import { useMemo, useState } from 'react'
import TabelSprin from '../components/TabelSprin'
import { useSprinStore } from '../lib/SprinStore'

const TABS = ['Semua', 'Menunggu', 'Terbit', 'Dikembalikan']
const TAB_KE_STATUS = { Menunggu: 'Menunggu Persetujuan', Terbit: 'Terbit', Dikembalikan: 'Dikembalikan' }

export default function DaftarSprin() {
  const { daftar } = useSprinStore()
  const [tabAktif, setTabAktif] = useState('Semua')

  const daftarTersaring = useMemo(() => {
    if (tabAktif === 'Semua') return daftar
    return daftar.filter((s) => s.status === TAB_KE_STATUS[tabAktif])
  }, [daftar, tabAktif])

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Daftar Surat Perintah
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Seluruh Sprin yang tercatat di Bag Ops Polres Cimahi.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((tab) => {
          const aktif = tab === tabAktif
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setTabAktif(tab)}
              className="rounded px-3 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: aktif ? '#0E1B2C' : '#FFFFFF',
                color: aktif ? '#FFFFFF' : '#67788C',
                border: aktif ? '1px solid #0E1B2C' : '1px solid #DDE3EA',
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      <TabelSprin daftar={daftarTersaring} pesanKosong="Tidak ada Sprin dengan status ini." />
    </main>
  )
}
