-- kategori_kegiatan (KRYD/PAM_VIP/UNRAS/OPERASI) ternyata tidak pernah dibaca
-- di mana pun oleh frontend -- sisa desain awal. Enumnya juga cuma 4 nilai
-- tetap, tidak muat untuk jenis kegiatan baru sembarang yang ditambah lewat
-- halaman Kelola Jenis Kegiatan (mis. "Pengamanan Insidental", "Operasi Lilin"
-- tidak cocok dipaksa ke salah satu dari 4 itu). Lepas constraint not-null-nya
-- daripada memaksa nilai yang tidak berarti apa-apa.
alter table public.jenis_kegiatan alter column kategori drop not null;
