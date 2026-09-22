# Database Paham.in

Proyek aktif: https://supabase.com/dashboard/project/cxbhkwcpfqsglmgeauri
Organisasi: Afif-luthfi's Org. Region: Singapura. Biaya proyek saat dibuat: US$0/bulan.

## Menjalankan aplikasi

1. `npm install`
2. Salin variabel `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` dari `.env.example` ke `.env.local`, lalu isi dari pengaturan API Supabase. Workspace ini sudah dikonfigurasi.
3. `npm run dev` (port 3000).
4. Daftar menggunakan email, konfirmasi tautan email, lalu login. Password dikelola Supabase Auth; tidak disimpan di tabel aplikasi atau localStorage aplikasi.

Atur Authentication > URL Configuration: Site URL dan redirect URL sesuai alamat lokal/deployment. Aktifkan provider Google dan masukkan kredensial OAuth bila ingin memakai login Google. NIM tetap unik di profil; login memakai email. Profil dibuat setelah sesi login valid. Jika NIM sudah terpakai, lengkapi profil menggunakan NIM yang benar.

## Cakupan data

| Tabel | Data |
|---|---|
| categories | 7 program studi/kategori |
| profiles | UUID akun Auth, NIM unik, nama, program studi, avatar |
| mentor_profiles | Mentor yang telah disetujui; nama publik, jurusan, avatar |
| mentor_verifications | Bidang, IPK, kontak, metadata transkrip, status dan catatan pemeriksaan |
| classes | Mentor, judul, deskripsi, kategori, jadwal, durasi, lokasi, harga, kuota, status |
| class_access | Tautan kelas privat untuk mentor dan peserta terkonfirmasi |
| class_materials | Judul materi, lokasi berkas atau URL |
| bookings | Peserta, kelas, status pendaftaran; unik per peserta/kelas |
| payments | Nominal IDR, metode, status, referensi penyedia, waktu pembayaran |
| wallet_entries | Pendapatan mentor dari pembayaran terverifikasi |
| withdrawals | Nominal, tujuan rekening/e-wallet, kanal dan status pencairan |
| class_reviews | Rating 1–5 dan komentar dari peserta terkonfirmasi setelah kelas selesai |
| notifications | Pesan permanen untuk pengguna, waktu dibaca |

Supabase Auth juga menyimpan akun, email, password hash, identitas OAuth dan sesi. Bucket privat `mentor-transcripts` menyimpan PDF/JPG/PNG maksimal 10 MB; `class-materials` menyimpan materi maksimal 20 MB. Path transkrip: `<user UUID>/<random UUID>/<filename>`. Path materi: `<class UUID>/<filename>`.

Semua 13 tabel menggunakan RLS dan hak kolom eksplisit. Data pribadi hanya dibaca pemilik. Profil publik mentor tidak berisi NIM, IPK, kontak atau transkrip. Frontend tidak boleh mengubah status mentor, pembayaran, pendapatan atau penarikan. RPC reservasi dan penarikan mengunci baris untuk menjaga kuota dan saldo. Jadwal disimpan sebagai timestamptz, ditampilkan WIB; input mengikuti zona waktu perangkat.

## Alur pengelola

Gunakan SQL Editor Supabase atau backend dengan service-role key. Jangan menaruh secret/service-role key di frontend. Jalankan setiap contoh dengan UUID yang benar, setelah memeriksa pengajuannya.

Persetujuan mentor setelah transkrip diperiksa:

```sql
select public.approve_mentor('UUID_PENGAJUAN'::uuid);
```

Penolakan pengajuan:

```sql
update public.mentor_verifications
set status='rejected', review_notes='Alasan penolakan', reviewed_at=now()
where id='UUID_PENGAJUAN'::uuid and status='pending';
```

Pembayaran belum terhubung ke payment gateway. Tombol pendaftaran hanya membuat reservasi dan pembayaran pending; tidak membuat saldo palsu. Setelah pembayaran benar-benar diverifikasi lewat penyedia atau rekonsiliasi manual:

```sql
select public.settle_payment('UUID_PEMBAYARAN'::uuid, 'REFERENSI_UNIK_PENYEDIA');
```

Fungsi tersebut atomik dan idempotent: konfirmasi booking, catat pendapatan Rp5.000 sekali, kirim notifikasi. Backend gateway kelak wajib memvalidasi tanda tangan callback, nominal, mata uang dan referensi sebelum memanggilnya.

Reservasi pending menahan kuota sampai diproses atau dibatalkan oleh pengelola (belum ada masa kedaluwarsa otomatis):

```sql
select public.cancel_pending_booking('UUID_BOOKING'::uuid);
```

Kuota dilepas sekali. Booking yang dibatalkan tetap menjadi riwayat; pendaftaran ulang pasangan pengguna/kelas tersebut belum tersedia. Pembayaran yang telah dikonfirmasi harus melalui rancangan alur refund tersendiri; jangan gunakan fungsi pembatalan pending untuk refund.

Penarikan disimpan sebagai permintaan, bukan transfer dana otomatis. Setelah transfer terverifikasi, pengelola mengubah status `withdrawals` menjadi `paid` dan mengisi `processed_at`; gunakan `rejected` bila ditolak. Saldo tersedia = pendapatan - penarikan pending/processing/paid. Belum ada antarmuka admin atau layanan payout.

Materi dapat dimasukkan oleh mentor lewat API/RLS atau pengelola lewat dashboard; unggah berkas ke bucket kemudian isi `class_materials`. UI dapat mengunduh materi privat. Form upload materi, UI ulasan, dan kotak masuk notifikasi belum ada di proyek awal; tabelnya sudah disiapkan. Toast interaksi sementara, filter pencarian, pilihan menu dan status modal tetap berada di state React.

## Migrasi dan pemeriksaan

Migrasi telah diterapkan ke proyek di atas. Nama versi file lokal disamakan dengan riwayat remote MCP agar tidak diterapkan ulang. Jangan menjalankan migrasi awal lagi pada database aktif. Untuk proyek baru, jalankan file migrasi secara berurutan.

- `npm run lint` — pengecekan TypeScript.
- `npm run build` — produksi.
- `supabase/tests/access_and_transactions.sql` — jalankan dengan SQL Editor pada database pengujian; seluruh data uji dibatalkan melalui ROLLBACK.
- Pengujian langsung sudah lulus untuk RLS profil, tautan privat, larangan self-approval/settlement, idempotensi reservasi/pembayaran, saldo, batas kuota 10, persetujuan mentor, dan pembatalan yang melepaskan kuota.
- Advisor keamanan: tidak ada temuan. Advisor performa hanya menginformasikan indeks belum digunakan pada database baru.

Data localStorage sebelumnya tidak diimpor otomatis karena identitas/otorisasi dan password versi simulasi tidak dapat dipercaya. Database awal hanya berisi kategori; pengujian tidak meninggalkan akun atau transaksi dummy. Autentikasi email/Google menyeluruh dan transfer pembayaran nyata belum diuji dengan akun pengguna/penyedia.
