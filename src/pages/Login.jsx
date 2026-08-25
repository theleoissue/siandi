import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconShield } from '../components/icons'
import { masuk, daftar, useAuth } from '../lib/auth'

const inputStyle = {
  border: '1px solid #DDE3EA',
  color: '#1A2634',
  backgroundColor: '#FFFFFF',
}

export default function Login() {
  const navigate = useNavigate()
  const { muatUlangProfil } = useAuth()
  const [mode, setMode] = useState('masuk') // 'masuk' | 'daftar'
  const [nrp, setNrp] = useState('')
  const [password, setPassword] = useState('')
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('')
  const [error, setError] = useState('')
  const [sukses, setSukses] = useState('')
  const [memproses, setMemproses] = useState(false)

  function ubahMode(modeBaru) {
    setMode(modeBaru)
    setError('')
    setSukses('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSukses('')

    if (mode === 'daftar' && password !== konfirmasiPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      return
    }

    setMemproses(true)
    try {
      if (mode === 'masuk') {
        await masuk(nrp, password)
      } else {
        await daftar(nrp, password)
        await muatUlangProfil()
        setSukses('Akun berhasil dibuat dan langsung masuk.')
      }
      // Alamat halaman tidak ikut berubah saat sesi berakhir, jadi kalau
      // sebelumnya berhenti di /sprin/<id> alamat itu masih tersisa dan
      // langsung dibuka lagi begitu login berhasil -- kelihatan sebagai
      // "Sprin tidak ditemukan" alih-alih Dashboard. Selalu mulai dari awal.
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Terjadi kesalahan, coba lagi.')
    } finally {
      setMemproses(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ backgroundColor: '#0E1B2C' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ border: '2px solid #C8A24A' }}
          >
            <IconShield size={30} color="#C8A24A" />
          </div>
          <div className="text-3xl tracking-widest" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#FFFFFF' }}>
            SIANDI
          </div>
          <div className="mt-2 text-xs uppercase tracking-widest" style={{ color: '#E8D9AE' }}>
            Sistem Informasi Surat Perintah Digital
          </div>
          <div className="mt-1 text-xs" style={{ color: '#8FA3BB' }}>
            Bagian Operasi · Polres Cimahi
          </div>
        </div>

        <form className="rounded-lg p-6" style={{ backgroundColor: '#FFFFFF' }} onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#67788C' }}>
              Nomor Registrasi Pokok
            </label>
            <input
              className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ ...inputStyle, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
              value={nrp}
              onChange={(e) => setNrp(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#67788C' }}>
              Kata sandi
            </label>
            <input
              type="password"
              className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === 'daftar' && (
            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#67788C' }}>
                Konfirmasi kata sandi
              </label>
              <input
                type="password"
                className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                style={inputStyle}
                value={konfirmasiPassword}
                onChange={(e) => setKonfirmasiPassword(e.target.value)}
                required
              />
            </div>
          )}

          {error && (
            <div className="mb-4 rounded px-3 py-2 text-xs" style={{ backgroundColor: '#FDECEA', color: '#B3261E' }}>
              {error}
            </div>
          )}
          {sukses && (
            <div className="mb-4 rounded px-3 py-2 text-xs" style={{ backgroundColor: '#E8F5EE', color: '#1F7A4D' }}>
              {sukses}
            </div>
          )}

          <button
            type="submit"
            disabled={memproses}
            className="w-full rounded py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: '#0E1B2C', color: '#FFFFFF' }}
          >
            {memproses ? 'Memproses…' : mode === 'masuk' ? 'Masuk' : 'Daftar'}
          </button>

          <button
            type="button"
            onClick={() => ubahMode(mode === 'masuk' ? 'daftar' : 'masuk')}
            className="mt-3 w-full text-center text-xs font-semibold"
            style={{ color: '#67788C' }}
          >
            {mode === 'masuk' ? 'Belum punya akun? Daftar dengan NRP' : 'Sudah punya akun? Masuk'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-relaxed" style={{ color: '#7A8DA5' }}>
          Pendaftaran hanya berhasil untuk NRP yang terdaftar di data personel Polres Cimahi.
        </p>
      </div>
    </div>
  )
}
