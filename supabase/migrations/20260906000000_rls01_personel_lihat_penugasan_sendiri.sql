-- RLS-01 (diperbaiki di 20260826000014) masih punya satu celah: personel
-- biasa (peran_sistem = 'PERSONEL') tidak pernah bisa membaca surat_perintah
-- SAMA SEKALI -- baik yang dia susun sendiri (personel tidak pernah menyusun
-- Sprin) maupun yang mencantumkan namanya sebagai personel yang ditugaskan.
-- Akibatnya menu "Penugasan Saya" (satu-satunya menu yang dilihat peran
-- PERSONEL) SELALU kosong untuk siapa pun, walau datanya sudah benar di
-- sprin_personel -- BUKAN cuma soal screenshot buku panduan yang basi, tapi
-- fitur inti yang belum pernah benar-benar berfungsi untuk peran ini.
--
-- Tambahkan klausa: boleh baca surat_perintah kalau pengguna tercantum di
-- sprin_personel (lewat sprin_kelompok) untuk Sprin itu.
drop policy rls_01_select_surat_perintah on public.surat_perintah;
create policy rls_01_select_surat_perintah on public.surat_perintah
  for select
  using (
    disusun_oleh = public.pengguna_id_saya()
    or public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN', 'KAPOLRES')
    or exists (
      select 1
      from public.sprin_kelompok sk
      join public.sprin_personel sp on sp.sprin_kelompok_id = sk.id
      where sk.surat_perintah_id = surat_perintah.id
        and sp.pengguna_id = public.pengguna_id_saya()
    )
  );

-- turunan_select_sprin_kelompok punya celah yang sama: cuma peran staf yang
-- disebut, PERSONEL tidak pernah masuk daftar -- padahal rls_02 di atas
-- sudah lebih dulu benar mengizinkan PERSONEL membaca baris sprin_personel
-- miliknya sendiri. Tanpa perbaikan ini, join sprin_kelompok(sprin_personel)
-- tetap kosong untuk PERSONEL karena baris induknya (sprin_kelompok) sendiri
-- tidak boleh dibaca, walau baris anaknya (sprin_personel) sudah boleh.
drop policy turunan_select_sprin_kelompok on public.sprin_kelompok;
create policy turunan_select_sprin_kelompok on public.sprin_kelompok
  for select
  using (
    public.peran_saya() in ('KABAG_OPS', 'KASUBBAG_BINOPS', 'PAURMIN', 'STAF_ADMIN', 'KAPOLRES')
    or exists (
      select 1 from public.sprin_personel sp
      where sp.sprin_kelompok_id = sprin_kelompok.id
        and sp.pengguna_id = public.pengguna_id_saya()
    )
  );
