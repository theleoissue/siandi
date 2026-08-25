export function unduhBlob(blob, namaFile) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = namaFile
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function namaFileAman(nomorLengkap) {
  return nomorLengkap.replace(/[/.\s]/g, '_')
}
