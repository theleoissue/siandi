export default function SegeraHadir({ judul }) {
  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div
        className="rounded-lg p-8 text-center text-sm"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #DDE3EA', color: '#67788C' }}
      >
        Halaman <strong>{judul}</strong> belum dibangun di tahap ini.
      </div>
    </main>
  )
}
