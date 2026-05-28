# KUMPULAN MASTER PROMPT: PENGEMBANGAN KELASLMS
## Tech Stack: Laravel 13 (Backend API) & Next.js 14 App Router (Frontend SPA)

---

### PROMPT 1: INISIALISASI & SETUP LINGKUNGAN KERJA (MINGGU 1)
Bertindaklah sebagai Senior Full-Stack Developer dan Software Architect. Saya ingin membangun proyek bernama KelasLMS menggunakan arsitektur headless terpisah (Decoupled Architecture). Backend menggunakan Laravel 13 murni sebagai REST API Engine, dan Frontend menggunakan Next.js 14 App Router sebagai Single Page Application (SPA).

Tugas Anda adalah memandu saya melakukan inisialisasi awal proyek ini. Berikan instruksi langkah demi langkah untuk:
1. Konfigurasi file .env Laravel agar mendukung integrasi lokal dengan Next.js.
2. Pengaturan Laravel Sanctum untuk menangani Autentikasi Stateful berbasis Session Cookie, bukan JWT.
3. Konfigurasi file config/cors.php untuk mengizinkan lalu lintas data silang-origin (Cross-Origin) hanya dari domain frontend lokal (localhost:3000) dengan status credentials aktif.
4. Inisialisasi proyek Next.js 14 menggunakan App Router dan Tailwind CSS, serta struktur konfigurasi Axios global yang membawa header 'X-Requested-With' dan konfigurasi 'withCredentials: true'.

Fokus hanya pada langkah eksekusi perintah terminal, instalasi dependency yang diperlukan, dan penjelasan konfigurasi arsitektur tanpa menuliskan contoh file implementasi kode fiturnya.

---

### PROMPT 2: PERANCANGAN SKEMA DATABASE & MIGRATION BLUEPRINT (MINGGU 2)
Bertindaklah sebagai Database Administrator. Saya membutuhkan struktur database yang kokoh menggunakan MySQL (InnoDB Engine) untuk proyek KelasLMS berbasis Laravel 13.

Tuliskan perintah migrasi Laravel (Laravel Migrations) secara lengkap untuk skema tabel berikut dengan konstrain integritas data (Foreign Key Constraints dengan aturan onDelete cascade):
1. Tabel 'users': id, name, email, password, role (enum: dosen, mahasiswa), nim_nip (unique), timestamps.
2. Tabel 'materials': id, user_id (dosen), title, description, file_path, file_type, timestamps.
3. Tabel 'assignments': id, user_id (dosen), title, instructions, attachment_path, deadline_at (datetime), timestamps.
4. Tabel 'submissions': id, assignment_id, user_id (mahasiswa), student_notes, file_path, grade (tinyint, nullable), lecturer_feedback, submitted_at, timestamps. Pastikan ada konstrain unique untuk kombinasi assignment_id dan user_id.
5. Tabel 'attendance_sessions': id, user_id (dosen), meeting_number (tinyint), topic, current_token, expires_at (timestamp), is_active (boolean), timestamps.
6. Tabel 'attendances': id, attendance_session_id, user_id (mahasiswa), status (enum: hadir, sakit, izin, alpa), scanned_at, notes, timestamps. Pastikan ada konstrain unique untuk kombinasi attendance_session_id dan user_id.

Tuliskan seluruh kode file migrasi Laravel tersebut secara utuh dan terstruktur tanpa memotong bagian kode. Jangan berikan contoh data pengujian, cukup kode migrasi mentah.

---

### PROMPT 3: IMPLEMENTASI BACKEND AUTH API & CUSTOM MIDDLEWARE (MINGGU 2)
Bertindaklah sebagai Backend Security Engineer. Berdasarkan database yang telah dibuat, implementasikan sistem autentikasi pada Laravel 13 API menggunakan Laravel Sanctum.

Saya membutuhkan:
1. AuthController yang menangani fungsi login (memvalidasi kredensial email dan password menggunakan aturan Form Request Validation), fungsi logout (menghancurkan sesi aktif), dan fungsi me/user (mengembalikan objek user yang sedang login).
2. Dua file Custom Middleware terpisah untuk memeriksa hak akses pengguna: 'EnsureUserIsLecturer' (hanya mengizinkan pengguna dengan role dosen) dan 'EnsureUserIsStudent' (hanya mengizinkan pengguna dengan role mahasiswa). Jika validasi role gagal, server harus mengembalikan respons JSON dengan kode HTTP 403 Forbidden.
3. Penulisan rute API pada file routes/api.php, pisahkan rute publik, rute terproteksi sanctum secara global, rute khusus dosen, dan rute khusus mahasiswa.

Tuliskan implementasi kodenya secara lengkap, bersih, mengikuti standar PSR-12, menggunakan Exception Handling yang ketat, dan tanpa menyertakan contoh data tiruan.

---

### PROMPT 4: INTEGRASI FRONTEND AUTH HOOK & ROUTE GUARDING (MINGGU 3)
Bertindaklah sebagai Senior Frontend Engineer yang ahli dalam Next.js 14 App Router. Saya perlu mengintegrasikan sistem autentikasi stateful cookie dari backend Laravel Sanctum ke dalam aplikasi Next.js.

Tugas Anda adalah membuat:
1. File utilitas atau custom React hook (misalnya useAuth) menggunakan pustaka SWR untuk mengelola state autentikasi user global, memicu request CSRF cookie terlebih dahulu sebelum melakukan login, menangani pengiriman data form login ke API backend, serta fungsi logout.
2. Mekanisme Route Guarding di dalam struktur App Router (menggunakan middleware Next.js atau HOC/Layout level). Jika pengguna belum terautentikasi (mendapat error 401 dari API), mereka harus dialihkan secara otomatis ke halaman login (/). Jika pengguna mencoba mengakses halaman yang tidak sesuai dengan role mereka (misal mahasiswa mengakses halaman khusus dosen), mereka harus dialihkan balik ke dashboard masing-masing.
3. Struktur layout utama dashboard yang bersih menggunakan Tailwind CSS.

Tuliskan seluruh kode file frontend ini secara mendetail dari atas sampai bawah tanpa ringkasan atau asumsi kode, serta jangan berikan contoh desain UI tiruan di luar fungsionalitas utama.

---

### PROMPT 5: CORE LMS FEATURES - MODUL MATERI & TUGAS (MINGGU 4)
Bertindaklah sebagai Full-Stack Developer. Implementasikan fitur inti LMS pada sistem backend Laravel dan frontend Next.js 14 untuk Modul Materi dan Modul Tugas.

Spesifikasi teknis yang harus Anda buat:
1. Modul Materi:
   - Backend: API untuk Dosen mengunggah berkas materi (validasi ekstensi pdf, pptx, docx, maksimal 10MB). Buat rute proxy download agar file materi di dalam folder privat Laravel hanya bisa diunduh oleh user yang sudah login melalui Storage::download().
   - Frontend: Halaman daftar materi (Next.js) dengan pemisahan tombol aksi berdasarkan role user.
2. Modul Tugas & Penilaian:
   - Backend: API Pembuatan Tugas oleh Dosen (menyimpan deskripsi instruksi dan deadline_at). API Pengumpulan Tugas oleh Mahasiswa yang memiliki logika validasi waktu tegas: Jika waktu saat ini melewati deadline_at, server wajib menolak unggahan tugas dan mengembalikan status HTTP 422. API Penilaian Tugas bagi Dosen untuk memperbarui kolom nilai (0-100) dan masukan feedback.
   - Frontend: Halaman detail instruksi tugas, komponen drop-zone pengumpulan file untuk mahasiswa dengan indikator status pengumpulan, serta panel dashboard bagi dosen untuk memeriksa file mahasiswa dan menginput nilai angka.

Tuliskan seluruh logika bisnis, validasi request, kontroler backend, dan komponen halaman frontend Next.js secara utuh, end-to-end, tanpa pemotongan fungsi kodingan, dan tanpa contoh data mock.

---

### PROMPT 6: KRITIKAL FITUR - ABSENSI QR CODE DINAMIS ANTI-FRAUD (MINGGU 5)
Bertindaklah sebagai Expert Cyber Security & Full-Stack Engineer. Saya ingin mengimplementasikan sistem Absensi berbasis QR Code Dinamis menggunakan prinsip Time-Based Token (serupa algoritma TOTP) untuk mencegah mahasiswa melakukan kecurangan titip absen atau memfoto QR Code.

Implementasikan alur logika berikut ke dalam kode program riil:
1. Backend Laravel (AttendanceController):
   - Fungsi createSession: Dosen membuat sesi pertemuan kelas baru.
   - Fungsi refreshToken: Dipanggil otomatis dari frontend setiap 15 detik. Logikanya: Hasilkan string token acak baru secara kriptografis via Str::random, simpan hash-nya di kolom current_token pada database, atur expires_at menjadi waktu sekarang ditambah 17 detik (2 detik kompensasi latensi). Gabungkan ID Sesi dan Token Acak mentah tersebut ke dalam string JSON, lalu enkripsi string tersebut menggunakan Crypt::encryptString(). Kembalikan payload terenkripsi ini ke client.
   - Fungsi scanQR: Menerima payload string terenkripsi hasil scan mahasiswa. Lakukan dekripsi (Crypt::decryptString), ambil ID Sesi dan token mentah. Periksa database: apakah waktu server saat ini belum melewati expires_at, dan jalankan Hash::check untuk memverifikasi kecocokan token mentah dengan hash di database. Jika lolos, ubah status absensi mahasiswa menjadi 'hadir'. Jika gagal, kembalikan HTTP 400 dengan kode 'QR_EXPIRED'.

2. Frontend Next.js (Dosen & Mahasiswa):
   - Halaman Sesi Dosen (/dashboard/attendance/session): Menggunakan fungsi polling otomatis (setInterval) setiap 15 detik untuk menembak API refreshToken, menerima string terenkripsi, lalu merendernya menjadi gambar QR Code baru secara otomatis di layar proyektor menggunakan pustaka qrcode.react.
   - Halaman Scan Mahasiswa (/dashboard/attendance/scan): Mengaktifkan modul kamera ponsel pada browser menggunakan pustaka html5-qrcode, membaca data terenkripsi dari QR Code proyektor, lalu mengirimkannya via POST ke API scanQR backend.

Tuliskan seluruh implementasi kode backend controller secara menyeluruh dan komponen frontend Next.js secara detail dari awal sampai akhir tanpa menyertakan contoh data simulasi ataupun memotong baris kode vital.

---

### PROMPT 7: OPTIMASI QUERY, AUDIT KEAMANAN, & PRODUCTION BUILD (MINGGU 6)
Bertindaklah sebagai Senior DevOps & Performance Engineer. Seluruh fitur utama KelasLMS telah selesai dibuat. Tugas Anda saat ini adalah membimbing saya melakukan proses Refactoring, Audit Keamanan, Optimasi Performa, dan Prosedur Deployment untuk lingkungan produksi.

Berikan instruksi dan kode penyesuaian untuk langkah-langkah berikut:
1. Optimasi Query Database (Laravel): Lakukan audit pada seluruh model Eloquent dan Controller yang telah dibuat sebelumnya. Tunjukkan cara menerapkan Eager Loading (menggunakan metode 'with()') untuk menghilangkan masalah degradasi performa query N+1 pada penarikan data relasi tugas, submission, sesi absen, dan rekap log kehadiran mahasiswa.
2. Pengamanan Storage: Konfigurasi file filesystem Laravel dan pembuatan perintah tautan simbolik (Storage Symlink) yang aman agar file tugas mahasiswa tetap privat dan tidak bisa diakses dari publik secara langsung tanpa validasi sesi.
3. Pengetatan Aturan Produksi (.env & CORS): Konfigurasi final file .env di sisi produksi, mematikan mode debug (APP_DEBUG=false), serta mengunci origin domain cors.php murni ke URL domain produksi Next.js.
4. Kompilasi Produksi Frontend: Langkah-langkah melakukan optimasi build pada Next.js (npm run build) untuk memastikan seluruh komponen halaman yang bersifat statis dikompilasi secara optimal di sisi server (Static Generation/SSR) dan komponen interaktif berjalan sebagai Client Component yang efisien.

Fokus murni pada instruksi optimasi kode arsitektur, parameter konfigurasi file sistem, dan langkah deployment tanpa menuliskan contoh file dummy atau data pengujian di luar cakupan teknis.