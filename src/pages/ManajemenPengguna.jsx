import { useEffect, useState } from 'react'
import { ambilDaftarAkun, resetPasswordAkunLain } from '../lib/adminApi'

const LABEL_PERAN = {
  KAPOLRES: 'Kapolres / Wakapolres',
  KABAG_OPS: 'Kabag Ops',
  KASUBBAG_BINOPS: 'Kasubbag Bin Ops',
  PAURMIN: 'Paurmin / Staf Bag Ops',
  STAF_ADMIN: 'Staf Admin (Tim Cyber)',
  PERSONEL: 'Personel',
}

const STATUS_STYLE = {
  true: { backgroundColor: '#E8F5EE', color: '#1F7A4D' },
  false: { backgroundColor: '#EEF1F5', color: '#67788C' },
}

function BarisAkun({ akun, onSukses }) {
  const [terbuka, setTerbuka] = useState(false)
  const [passwordBaru, setPasswordBaru] = useState('')
  const [memproses, setMemproses] = useState(false)
  const [pesan, setPesan] = useState(null)

  async function submit() {
    if (passwordBaru.length < 6) {
      setPesan({ jenis: 'error', teks: 'Password minimal 6 karakter.' })
      return
    }
    setMemproses(true)
    setPesan(null)
    try {
      await resetPasswordAkunLain(akun.nrp, passwordBaru)
      setPesan({ jenis: 'ok', teks: 'Password berhasil diubah.' })
      setPasswordBaru('')
      onSukses?.()
    } catch (e) {
      setPesan({ jenis: 'error', teks: e.message })
    } finally {
      setMemproses(false)
    }
  }

  return (
    <>
      <tr style={{ borderTop: '1px solid #DDE3EA' }}>
        <td className="px-4 py-2.5">
          {akun.pangkat ? `${akun.pangkat} ` : ''}
          {akun.nama}
        </td>
        <td
          className="px-4 py-2.5 text-xs"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', color: '#67788C' }}
        >
          {akun.nrp}
        </td>
        <td className="px-4 py-2.5 text-xs">{LABEL_PERAN[akun.peran_sistem] ?? akun.peran_sistem}</td>
        <td className="px-4 py-2.5">
          <span className="rounded px-2 py-0.5 text-xs font-semibold" style={STATUS_STYLE[akun.status_aktif]}>
            {akun.status_aktif ? 'Aktif' : 'Nonaktif'}
          </span>
        </td>
        <td className="px-4 py-2.5 text-xs">
          <button
            type="button"
            className="font-semibold"
            style={{ color: '#0E1B2C' }}
            onClick={() => {
              setTerbuka((v) => !v)
              setPesan(null)
            }}
          >
            {terbuka ? 'Batal' : 'Reset password'}
          </button>
        </td>
      </tr>
      {terbuka && (
        <tr style={{ backgroundColor: '#F9FAFB', borderTop: '1px solid #DDE3EA' }}>
          <td colSpan={5} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Password baru (min. 6 karakter)"
                className="rounded px-3 py-1.5 text-sm outline-none focus:ring-2"
                style={{ border: '1px solid #DDE3EA', color: '#1A2634', backgroundColor: '#FFFFFF' }}
                value={passwordBaru}
                onChange={(e) => setPasswordBaru(e.target.value)}
              />
              <button
                type="button"
                disabled={memproses}
                onClick={submit}
                className="rounded px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: '#0E1B2C' }}
              >
                {memproses ? 'Menyimpan…' : 'Simpan password baru'}
              </button>
              {pesan && (
                <span className="text-xs font-medium" style={{ color: pesan.jenis === 'ok' ? '#1F7A4D' : '#B4232C' }}>
                  {pesan.teks}
                </span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function ManajemenPengguna() {
  const [akunList, setAkunList] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [error, setError] = useState(null)

  async function muatUlang() {
    setMemuat(true)
    setError(null)
    try {
      setAkunList(await ambilDaftarAkun())
    } catch (e) {
      setError(e.message)
    } finally {
      setMemuat(false)
    }
  }

  useEffect(() => {
    muatUlang()
  }, [])

  return (
    <main className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#0E1B2C' }}>
          Manajemen Pengguna
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#67788C' }}>
          Akun sistem yang sudah punya login, dan hak akses yang melekat padanya. Reset password hanya bisa
          dilakukan oleh Staf Admin.
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
              {akunList.map((a) => (
                <BarisAkun key={a.id} akun={a} onSukses={muatUlang} />
              ))}
              {!memuat && akunList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs" style={{ color: '#67788C' }}>
                    Belum ada akun yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {memuat && (
        <p className="mt-2 text-xs" style={{ color: '#67788C' }}>
          Memuat…
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs" style={{ color: '#B4232C' }}>
          Gagal memuat: {error}
        </p>
      )}
    </main>
  )
}
