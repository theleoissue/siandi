import { useMemo, useState } from 'react'
import { PERSONEL_CONTOH } from '../lib/personelContoh'

const BATAS_TAMPIL = 60

export default function DataPersonel() {
  const [kataKunci, setKataKunci] = useState('')

  const { nip, ps } = useMemo(() => {
    let nip = 0
    let ps = 0
    for (const p of PERSONEL_CONTOH) {
      if (p.jenisId === 'NIP') nip++
      if (p.jabatanStruktur.includes('(PS)')) ps++
    }
    return { nip, ps }
  }, [])

  const tersaring = useMemo(() => {
    const q = kataKunci.trim().toLowerCase()
    if (!q) return PERSONEL_CONTOH
    return PERSONEL_CONTOH.filter(
      (p) => p.nama.toLowerCase().includes(q) || p.nrp.includes(q) || p.jabatanStruktur.toLowerCase().includes(q),
    )
  }, [kataKunci])

  const tampil = tersaring.slice(0, BATAS_TAMPIL)

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Data Personel
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          {PERSONEL_CONTOH.length.toLocaleString('id-ID')} personel · {nip} ber-NIP · {ps} mengemban jabatan sebagai
          pelaksana sementara
        </p>
      </div>

      <div className="mb-4 max-w-md">
        <input
          placeholder="Cari nama, NRP/NIP, atau jabatan"
          className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
          style={{ border: '1px solid #DDE3EA', color: '#1A2634', backgroundColor: '#FFFFFF' }}
          value={kataKunci}
          onChange={(e) => setKataKunci(e.target.value)}
        />
      </div>

      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F4F6F8' }}>
                {['Pangkat', 'Nama', 'NRP / NIP', 'Jabatan Struktur', 'Satuan Fungsi'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: '#67788C' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tampil.map((p) => (
                <tr key={p.nrp} style={{ borderTop: '1px solid #DDE3EA' }}>
                  <td className="px-4 py-2 text-xs">{p.pangkat}</td>
                  <td className="px-4 py-2 text-sm font-medium">{p.nama}</td>
                  <td
                    className="px-4 py-2 text-xs"
                    style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                  >
                    {p.nrp}
                  </td>
                  <td className="px-4 py-2 text-xs">{p.jabatanStruktur}</td>
                  <td className="px-4 py-2 text-xs">{p.satuanFungsi}</td>
                </tr>
              ))}
              {tampil.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs" style={{ color: '#67788C' }}>
                    Tidak ada personel yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-2 text-xs" style={{ color: '#67788C' }}>
        {kataKunci
          ? `${tersaring.length} hasil ditemukan${tersaring.length > BATAS_TAMPIL ? `, menampilkan ${BATAS_TAMPIL} pertama` : ''}.`
          : `Menampilkan ${BATAS_TAMPIL} pertama. Ketik untuk mencari.`}
      </div>
    </main>
  )
}
