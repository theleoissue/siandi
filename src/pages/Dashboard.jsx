import { IconChevronRight } from '../components/icons'

const STAT_CARDS = [
  { label: 'Sprin terbit', value: '9', color: '#1F7A4D' },
  { label: 'Menunggu persetujuan', value: '0', color: '#8A6100' },
  { label: 'Baris penugasan', value: '1.525', color: '#0E1B2C' },
  { label: 'Personel terdata', value: '1.171', color: '#0E1B2C' },
]

const SPRIN_TERBARU = [
  { judul: 'Operasi Kepolisian Pekat I Lodaya 2026', nomor: 'Sprin/368/II/OPS.1.3./2026 · 44 personel · 17 kelompok', status: 'Terbit' },
  { judul: 'Pengamanan Hari Raya Idul Fitri 1447 H', nomor: 'Sprin/535/III/OPS.1.2.3./2026 · 617 personel · 43 kelompok', status: 'Terbit' },
  { judul: 'Pengamanan Kedatangan Wakapolri ke Wilkum Polres Cimahi', nomor: 'Sprin/1421/VI/PAM.2.2./2026 · 104 personel · 17 kelompok', status: 'Terbit' },
  { judul: 'Pengamanan Kunjungan Kerja Kapolri ke Sespim Lemdiklat Polri', nomor: 'Sprin/1491/VII/PAM.2.2./2026 · 315 personel · 20 kelompok', status: 'Terbit' },
  { judul: 'Pengamanan Aksi Unjuk Rasa Aliansi SP/SB Kota Cimahi', nomor: 'Sprin/1600/VII/PAM.3.2./2026 · 242 personel · 40 kelompok', status: 'Terbit' },
  { judul: 'Kegiatan Rutin yang Ditingkatkan / Patroli dan Razia Skala Besar', nomor: 'Sprin/1605/VII/PAM.1.3.2./2026 · 54 personel · 15 kelompok', status: 'Terbit' },
]

const BEBAN_PENUGASAN = [
  { nama: 'KOMPOL SAEFUL BAHRI, S. Pd. I.', jumlah: 7 },
  { nama: 'KOMPOL ZULKARNAEN.,S.H.,S.I.K.,M.I.K.', jumlah: 7 },
  { nama: '84121923', jumlah: 6 },
  { nama: 'AKP ENDANG MULYANA, S.IP., M.Si.', jumlah: 5 },
  { nama: 'AKP TAUFIK, S.H.', jumlah: 5 },
  { nama: 'AIPTU I WAYAN ISMANTA', jumlah: 5 },
  { nama: 'AIPDA DADANG SULAEMAN', jumlah: 5 },
]

const MAKS_BEBAN = Math.max(...BEBAN_PENUGASAN.map((b) => b.jumlah))

export default function Dashboard() {
  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Rekapitulasi surat perintah dan sebaran penugasan · 9 Agustus 2026
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="rounded-lg p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
            <div className="text-3xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: s.color }}>
              {s.value}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wide" style={{ color: '#67788C' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-lg p-4 lg:col-span-2" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
          <div className="mb-3 text-sm font-semibold" style={{ color: '#0E1B2C' }}>
            Surat perintah terbaru
          </div>
          <div className="space-y-2">
            {SPRIN_TERBARU.map((s) => (
              <button
                key={s.nomor}
                type="button"
                className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left hover:opacity-80"
                style={{ border: '1px solid #DDE3EA' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.judul}</div>
                  <div
                    className="mt-0.5 truncate text-xs"
                    style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                  >
                    {s.nomor}
                  </div>
                </div>
                <span
                  className="inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: '#E8F5EE', color: '#1F7A4D' }}
                >
                  {s.status}
                </span>
                <IconChevronRight size={15} color="#67788C" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
          <div className="mb-1 text-sm font-semibold" style={{ color: '#0E1B2C' }}>
            Beban penugasan aktif
          </div>
          <div className="mb-3 text-xs" style={{ color: '#67788C' }}>
            Hanya kelompok pelaksana, di luar operasi
          </div>
          <div className="space-y-2.5">
            {BEBAN_PENUGASAN.map((b) => (
              <div key={b.nama}>
                <div className="mb-1 flex justify-between gap-2 text-xs">
                  <span className="truncate">{b.nama}</span>
                  <span style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                    {b.jumlah}
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: '#EEF1F5' }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${(b.jumlah / MAKS_BEBAN) * 100}%`, backgroundColor: '#C8A24A' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
