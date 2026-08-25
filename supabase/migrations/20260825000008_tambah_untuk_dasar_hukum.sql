-- Ditemukan saat membangun fitur cetak/unduh dokumen (docx/xlsx): butir "Untuk"
-- pada surat perintah dihasilkan dinamis dari jenis kegiatan + tanggal/jam apel
-- (BR-04), tapi tidak pernah disimpan ke mana pun -- hanya ada di memori
-- frontend saat draf disusun. Begitu halaman dimuat ulang, teksnya hilang.
-- Disimpan sebagai snapshot beku saat Sprin diajukan (bukan dihitung ulang saat
-- dibaca), karena bunyi butir "Untuk" adalah bagian dari isi surat yang sudah
-- disahkan -- tidak boleh berubah walau data lain berubah belakangan.

alter table public.surat_perintah add column butir_untuk text[];

-- sprin_dasar_hukum_baku (tabel pivot Sprin <-> dasar_hukum_baku) sudah ada dari
-- migrasi awal tapi belum pernah diisi -- ajukanSprinDb sekarang mengisinya.
