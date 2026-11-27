# VideoPanel — Starter gratis

## Yang disiapkan
- Login admin melalui Supabase Auth.
- Upload video dari browser HP/komputer ke Supabase Storage.
- Link tontonan publik berbentuk `https://DOMAIN/#/v/KODE`.
- Daftar video dan hapus video.
- Frontend statis yang dapat di-host di Cloudflare Pages.

## Penting sebelum dipakai
1. Buat project di Supabase.
2. Di Authentication > Users, tambahkan akun admin sendiri (email + password).
3. Di SQL Editor, jalankan seluruh isi `supabase-setup.sql`.
4. Buka Project Settings > API, salin Project URL dan anon/publishable key.
5. Upload folder ini ke GitHub sebagai repository baru.
6. Di Cloudflare Pages, buat project dari repository GitHub:
   - Framework preset: None
   - Build command: kosongkan
   - Build output directory: `.` (folder root proyek)
7. Setelah deployment, buka URL `*.pages.dev` dari HP.
8. Isi Project URL dan anon/publishable key pada halaman konfigurasi.
9. Login dengan akun admin yang dibuat di Supabase.
10. Upload video uji ukuran kecil. Salin link dan coba buka di tab incognito.

## Keamanan
- Jangan pernah memasukkan `service_role` key ke website.
- Jangan bagikan password admin.
- Bucket video publik berarti siapa pun yang memiliki URL file dapat mengakses file tersebut.
- Starter ini untuk video publik yang memang boleh dibagikan. Jangan unggah materi privat/sensitif atau konten yang melanggar hak cipta.
- Hapus file juga dari Storage bila menghapus metadata. Versi starter ini berusaha menghapus file setelah metadata dihapus.
- Jika upload gagal, periksa kuota/limit file Supabase, kebijakan RLS, format, dan koneksi.

## Batasan versi awal
- Upload berjalan dari browser dan halaman harus tetap terbuka sampai selesai.
- Tidak ada transcoding, kompresi otomatis, thumbnail, resume upload, atau streaming adaptif.
- Video besar dapat lambat/gagal sesuai batas paket dan jaringan. Untuk penggunaan ramai/banyak video, perlu layanan penyimpanan dan bandwidth khusus.
- Link tontonan menggunakan hash route (`#/v/...`) supaya hosting statis tidak perlu konfigurasi rewrite.

## Cara mengubah nama website
Nama tampilan dapat diubah di `index.html`. Subdomain Cloudflare Pages dipilih saat membuat project.
