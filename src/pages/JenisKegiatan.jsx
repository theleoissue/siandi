import JENIS_KEGIATAN_REFERENSI from '../data/jenisKegiatanReferensi.json'

function ChipBaku({ nama, rasio, sifat }) {
  const style =
    sifat === 'pelaksana'
      ? { backgroundColor: '#E8F5EE', color: '#1F7A4D' }
      : { backgroundColor: '#EEF1F5', color: '#67788C' }
  return (
    <span className="rounded px-2 py-0.5 text-xs font-semibold" style={style}>
      {nama} <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', opacity: 0.7 }}>{rasio}</span>
    </span>
  )
}

function ChipPernahDipakai({ nama, rasio }) {
  return (
    <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: '#F4F6F8', color: '#67788C' }}>
      {nama} <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>{rasio}</span>
    </span>
  )
}

export default function JenisKegiatan() {
  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Jenis Kegiatan
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Susunan baku yang mengisi surat secara otomatis, diturunkan dari Surat Perintah yang benar-benar terbit.
        </p>
      </div>

      <div className="space-y-4">
        {JENIS_KEGIATAN_REFERENSI.map((jk) => (
          <div key={jk.nama} className="rounded-lg p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA' }}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-medium">{jk.nama}</div>
                <div
                  className="mt-0.5 text-xs"
                  style={{ color: '#67788C', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
                >
                  {jk.meta}
                </div>
              </div>
              <div className="text-right text-xs" style={{ color: jk.status === 'diperiksa bentrok' ? '#1F7A4D' : '#67788C' }}>
                {jk.status}
                <div style={{ color: '#67788C' }}>{jk.sumberContoh}</div>
              </div>
            </div>

            {jk.peringatanSatuContoh && (
              <div className="mt-2 rounded px-3 py-1.5 text-xs" style={{ backgroundColor: '#FDF6E3', color: '#8A6100' }}>
                Hanya satu contoh. Susunan ini contoh yang dapat dihapus, belum kerangka tetap.
              </div>
            )}

            <div className="mt-3 text-xs font-semibold uppercase" style={{ color: '#67788C' }}>
              Baku ({jk.baku.length})
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {jk.baku.map((g) => (
                <ChipBaku key={g.nama} {...g} />
              ))}
            </div>

            {jk.pernahDipakai.length > 0 && (
              <>
                <div className="mt-3 text-xs font-semibold uppercase" style={{ color: '#67788C' }}>
                  Pernah dipakai ({jk.pernahDipakai.length})
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {jk.pernahDipakai.map((g) => (
                    <ChipPernahDipakai key={g.nama} {...g} />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
