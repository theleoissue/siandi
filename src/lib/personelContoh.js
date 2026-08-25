// Contoh kecil data personel, diambil nyata dari hasil pencarian "de" di
// SIANDI_Mockup_v3.html — BUKAN 1.171 data KUATPERS penuh. Cukup untuk menguji alur
// Buat Sprin -> Persetujuan sampai data KUATPERS asli tersambung (tahap berikutnya).
export const PERSONEL_CONTOH = [
  { nama: 'AKP DEVI PUSPA SARI, S.Pd., M.M.', nrp: '87121335', pangkat: 'AKP', jabatanStruktur: 'KASUBBAG BINOPS BAG OPS' },
  { nama: 'IPDA ALLANDEFIT RIHANDO DANANTASA, S.Tr.K.', nrp: '00121290', pangkat: 'IPDA', jabatanStruktur: 'PAUR SUBBAG BIN OPS BAG OPS' },
]

export function cariPersonelContoh(kataKunci) {
  const q = kataKunci.trim().toLowerCase()
  if (q.length < 2) return []
  return PERSONEL_CONTOH.filter((p) => p.nama.toLowerCase().includes(q))
}
