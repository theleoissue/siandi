const AKUN = [
  { nama: 'AKBP MOH. FARUK ROZI, S.H, S.I.K., M.Si', nrp: '85052234', hakAkses: 'Kapolres / Wakapolres', status: 'Aktif' },
  { nama: 'KOMPOL SAEFUL BAHRI, S. Pd. I.', nrp: '76010326', hakAkses: 'Kabag Ops', status: 'Aktif' },
  { nama: 'AKP DEVI PUSPA SARI, S.Pd., M.M.', nrp: '87121335', hakAkses: 'Kasubbag Bin Ops', status: 'Aktif' },
  { nama: 'IPDA RD ALI NURJAMAL, S.Psi., M.M.', nrp: '87110847', hakAkses: 'Paurmin / Staf Bag Ops', status: 'Aktif' },
  { nama: '—', nrp: '84121923', hakAkses: 'Personel Polres Cimahi', status: 'Sudah mutasi' },
]

const STATUS_STYLE = {
  Aktif: { backgroundColor: '#E8F5EE', color: '#1F7A4D' },
  'Sudah mutasi': { backgroundColor: '#EEF1F5', color: '#67788C' },
}

export default function ManajemenPengguna() {
  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Manajemen Pengguna
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Akun sistem dan hak akses yang melekat padanya.
        </p>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F4F6F8' }}>
                {['Nama', 'NRP', 'Hak akses', 'Status', ''].map((h) => (
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
              {AKUN.map((a) => (
                <tr key={a.nrp} style={{ borderTop: '1px solid #DDE3EA' }}>
                  <td className="px-4 py-2.5">{a.nama}</td>
                  <td
                    className="px-4 py-2.5 text-xs"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color: '#67788C' }}
                  >
                    {a.nrp}
                  </td>
                  <td className="px-4 py-2.5 text-xs">{a.hakAkses}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded px-2 py-0.5 text-xs font-semibold" style={STATUS_STYLE[a.status]}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: '#0E1B2C' }}>
                    Ubah
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-2 text-xs" style={{ color: '#67788C' }}>
        Akun demo. Pada sistem sebenarnya seluruh personel memiliki akun penerima tugas.
      </p>
    </main>
  )
}
