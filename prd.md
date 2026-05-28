Markdown# PRODUCT REQUIREMENT DOCUMENT (PRD)

## PROJECT NAME: KelasLMS (Enterprise-Grade Class LMS with Dynamic QR Attendance)
| Attribute | Details |
| :--- | :--- |
| **Document Version** | 1.3.0 (Integrated Planning Edition) |
| **Author** | Project Lead & Technical Architect |
| **Tech Stack** | Laravel 13 (Headless API) & Next.js 14 App Router (Frontend SPA) |
| **Target Release** | Semester Ganjil 2026 |
| **Status** | Approved / Ready for Development |

---

## 1. PENDAHULUAN & LATAR BELAKANG

### 1.1 Masalah (Problem Statement)
Administrasi kelas perkuliahan konvensional seringkali menghadapi kendala inefisiensi dalam pengumpulan tugas, keterlambatan distribusi materi, serta tingginya risiko kecurangan absensi (seperti titip absen atau penyebaran foto QR code statis ke luar ruang kelas). Kelas perkuliahan membutuhkan platform mandiri yang tangkas (*agile*), responsif, dan memiliki sistem pengamanan kehadiran yang valid secara *real-time*.

### 1.2 Tujuan Proyek (Objective)
Membangun platform *Learning Management System* (LMS) mandiri skala kelas menggunakan arsitektur terpisah (*decoupled/headless architecture*). Aplikasi frontend berbasis Next.js bertindak sebagai *Single Page Application* (SPA) untuk menyajikan performa antarmuka yang instan tanpa *page reload*, sedangkan Laravel bertindak sebagai *stateless API engine* yang mengelola seluruh logika bisnis, validasi, manajemen berkas, dan integritas basis data.

---

## 2. MATRIKS HAK AKSES PENGGUNA (ROLE MATRIX)

Sistem ini menerapkan pembatasan hak akses secara ketat di tingkat *middleware* API untuk dua aktor utama:

| Modul / Fitur | Hak Akses Dosen (Lecturer) | Hak Akses Mahasiswa (Student) |
| :--- | :--- | :--- |
| **Autentikasi** | Login, Logout, Cek Sesi | Login, Logout, Cek Sesi |
| **Manajemen Materi** | Create, Read, Update, Delete (Full CRUD) | Read & Download Berkas |
| **Manajemen Tugas** | Create, Read, Update, Delete (Full CRUD) | Read Tugas & Upload Jawaban |
| **Grading Engine** | Unduh Jawaban, Input Nilai & Feedback | Lihat Nilai Akhir & Feedback |
| **Absensi QR Dinamis**| Buka/Tutup Sesi, Monitor Log, Generate Token | Akses Kamera & Scanning Token |

---

## 3. SPESIFIKASI SKEMA DATABASE (LARAVEL MIGRATIONS)

Seluruh relasi tabel menggunakan mesin InnoDB dengan konstrain *foreign key* bertipe `cascade` untuk menjamin integritas data saat terjadi penghapusan data induk.

### 3.1 Tabel `users`
```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    $table->enum('role', ['dosen', 'mahasiswa']);
    $table->string('nim_nip')->unique(); // NIM Mahasiswa atau NIP Dosen
    $table->rememberToken();
    $table->timestamps();
});
```

### 3.2 Tabel `materials`
```php
Schema::create('materials', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
    $table->string('title', 150);
    $table->text('description')->nullable();
    $table->string('file_path'); 
    $table->string('file_type', 10); // pdf, pptx, docx, mp4
    $table->timestamps();
});
```

### 3.3 Tabel `assignments`
```php
Schema::create('assignments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
    $table->string('title', 150);
    $table->text('instructions');
    $table->string('attachment_path')->nullable(); 
    $table->dateTime('deadline_at');
    $table->timestamps();
});
```

### 3.4 Tabel `submissions`
```php
Schema::create('submissions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('assignment_id')->constrained('assignments')->onDelete('cascade');
    $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // ID Mahasiswa
    $table->text('student_notes')->nullable();
    $table->string('file_path'); 
    $table->unsignedTinyInteger('grade')->nullable(); // Skala nilai: 0 - 100
    $table->text('lecturer_feedback')->nullable();
    $table->timestamp('submitted_at')->useCurrent();
    $table->timestamps();
    
    $table->unique(['assignment_id', 'user_id']); // 1 mahasiswa hanya bisa mengumpul 1 kali per tugas
});
```

### 3.5 Tabel `attendance_sessions`
```php
Schema::create('attendance_sessions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // ID Dosen
    $table->unsignedTinyInteger('meeting_number'); // Pertemuan ke- (1 - 16)
    $table->string('topic', 150);
    $table->string('current_token')->nullable(); // Token enkripsi QR yang aktif
    $table->timestamp('expires_at')->nullable(); // Batas kedaluwarsa token QR
    $table->boolean('is_active')->default(true); // Status buka/tutup absensi
    $table->timestamps();
});
```

### 3.6 Tabel `attendances`
```php
Schema::create('attendances', function (Blueprint $table) {
    $table->id();
    $table->foreignId('attendance_session_id')->constrained('attendance_sessions')->onDelete('cascade');
    $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // ID Mahasiswa
    $table->enum('status', ['hadir', 'sakit', 'izin', 'alpa'])->default('alpa');
    $table->timestamp('scanned_at')->nullable();
    $table->string('notes')->nullable(); // Catatan pendukung (misal: nomor surat dokter)
    $table->timestamps();

    $table->unique(['attendance_session_id', 'user_id']);
});
```

---

## 4. SPESIFIKASI FUNGSIONAL MENDALAM & LOGIKA BISNIS

### 4.1 Modul Autentikasi & Proteksi Stateful Sesi
- **Sistem Kerja**: Menggunakan Laravel Sanctum Stateful Cookies. Frontend Next.js wajib mengirimkan request awal ke `/sanctum/csrf-cookie` untuk mendapatkan token CSRF sebelum mengeksekusi API login.
- **Route Guarding**: Setiap perpindahan halaman pada Next.js memicu pengecekan status ke endpoint `/api/user`. Jika server merespons dengan HTTP 401 Unauthorized, seluruh state lokal di frontend wajib dihancurkan dan halaman diarahkan langsung ke rute `/` (Halaman Login).

### 4.2 Modul Manajemen Materi Kuliah
- **Unggah Dokumen (Dosen)**: Validasi file ketat di sisi server hanya menerima ekstensi `.pdf`, `.pptx`, dan `.docx` dengan ukuran maksimal berkas sebesar 10MB. Berkas disimpan di dalam direktori terproteksi `storage/app/private/materials`.
- **Unduh Dokumen (Mahasiswa)**: Next.js akan memanggil endpoint proxy Laravel yang bertugas memvalidasi sesi mahasiswa terlebih dahulu sebelum mengalirkan berkas menggunakan metode `Storage::download()`.

### 4.3 Modul Manajemen Tugas & Aturan Validasi Batas Waktu
- **Pengecekan Waktu Pengumpulan Tugas**: Saat mahasiswa mengunggah tugas via `POST /api/assignments/{id}/submit`, server Laravel akan membandingkan waktu aktual `now()` server dengan kolom `deadline_at` pada database.
- **Validasi**: Jika `now() > deadline_at`, request digagalkan seketika dengan mengembalikan kode HTTP 422 Unprocessable Entity dan pesan kesalahan *"Batas waktu pengumpulan tugas telah berakhir"*.

### 4.4 Modul Absensi QR Code Dinamis Berbasis Waktu (Anti-Fraud)
Modul ini menggunakan mekanisme mirip dengan algoritma TOTP (Time-Based One-Time Password) untuk meminimalisasi kecurangan titip absen antar mahasiswa.

#### Alur Logika Refresh Token (Sisi Dosen)
1. Dasbor Dosen (Next.js) yang dibuka di proyektor ruang kelas secara otomatis mengirimkan request berkala via AJAX setiap 15 detik ke endpoint `GET /api/attendance/session/{id}/refresh`.
2. Di sisi backend Laravel, sistem akan membuat string token acak baru menggunakan `Str::random(32)`, memperbarui database dengan hash token tersebut (`Hash::make($newToken)`), dan mengatur kolom `expires_at` menjadi `now()->addSeconds(17)` (toleransi latensi jaringan selama 2 detik).
3. Server mengenkripsi paket string berupa gabungan ID Sesi dan Token Acak menggunakan `Crypt::encryptString(json_encode([...]))` lalu mengembalikannya ke Next.js untuk dirender menjadi gambar QR Code baru.

#### Alur Logika Pemindaian & Validasi (Sisi Mahasiswa)
1. Mahasiswa membuka menu absensi di ponsel mereka, sistem mengaktifkan kamera browser via Next.js untuk memindai QR Code di layar proyektor kelas.
2. Hasil pemindaian dikirimkan oleh frontend mahasiswa ke server melalui endpoint `POST /api/attendance/scan`.
3. Backend Laravel mendekripsi string payload menggunakan `Crypt::decryptString()`, memeriksa apakah `now()` server masih kurang dari `expires_at`, dan memvalidasi token menggunakan `Hash::check()`. Jika sukses, status mahasiswa pada tabel `attendances` otomatis diperbarui menjadi **hadir**.

---

## 5. KEBUTUHAN NON-FUNGSIONAL (NON-FUNCTIONAL REQUIREMENTS)

### 5.1 Keamanan Sistem (Security)
- **Kebijakan CORS (Cross-Origin Resource Sharing)**: Header `Access-Control-Allow-Origin` wajib dikonfigurasi statis hanya menerima alamat domain resmi frontend (misalnya `http://localhost:3000`). Penggunaan wildcard (`*`) dilarang keras.
- **Pencegahan SQL Injection**: Seluruh interaksi query basis data wajib menggunakan fitur bawaan Laravel Eloquent ORM atau teknik Query Binding (PDO).

### 5.2 Performa & Optimasi Server
- **Manajemen Kapasitas Server**: Batas maksimal unggahan file dikunci di tingkat server melalui file konfigurasi `php.ini` dengan parameter `upload_max_filesize = 10M` dan `post_max_size = 10M`.
- **Optimasi Basis Data**: Seluruh pengambilan relasi data antar tabel di Laravel wajib menggunakan teknik Eager Loading (`with(['user', 'submissions'])`) untuk menghindari masalah query *N+1 Problem*.

---

## 6. SITEMAP FRONTEND & STRUKTUR ROUTER (NEXT.JS)

```plaintext
src/
├── app/
│   ├── page.js                          // CSR: Form Login Utama & Request Awal CSRF Cookie
│   └── dashboard/
│       ├── layout.js                    // SSR: Layout Navigasi Utama, Proteksi Sesi Global
│       ├── page.js                      // SSR: Summary Dashboard Widget (Total Tugas & Kehadiran)
│       ├── materials/
│       │   └── page.js                  // CSR: List Berkas (Dosen: Upload/Delete, Mahasiswa: Download)
│       ├── assignments/
│       │   ├── page.js                  // SSR: Daftar Seluruh Judul Tugas Kuliah
│       │   └── [id]/
│       │       ├── page.js              // CSR: Detail Instruksi Tugas & Form Drag & Drop Pengumpulan
│       │       └── grading/
│       │           └── page.js          // CSR: Panel Penilaian Berkas Jawaban Mahasiswa (Khusus Dosen)
│       └── attendance/
│           ├── page.js                  // SSR: Panel Laporan Rekapitulasi Persentase Absensi Kelas
│           ├── session/
│           │   └── page.js              // CSR: Tampilan Proyektor Dosen (Komponen Auto-refresh QR Code)
│           └── scan/
│               └── page.js              // CSR: Modul Scanner Kamera HP Mahasiswa (Library Html5Qrcode)
```

---

## 7. KAMUS API RESTFUL (API SPECIFICATIONS MATRIX)

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/login` | Public | Autentikasi kredensial pengguna & pembuatan cookie sesi. |
| **POST** | `/api/logout` | Private (All) | Revokasi sesi aktif dan penghancuran cookie. |
| **GET** | `/api/user` | Private (All) | Mendapatkan objek biodata profil pengguna yang aktif. |
| **GET** | `/api/materials` | Private (All) | Mengambil seluruh koleksi daftar materi kuliah. |
| **POST** | `/api/materials` | Dosen Only | Menyimpan materi baru (Maksimal berkas 10 MB). |
| **GET** | `/api/assignments` | Private (All) | Mengambil daftar instruksi tugas kelas. |
| **POST** | `/api/assignments` | Dosen Only | Pembuatan tugas baru lengkap dengan set deadline. |
| **POST** | `/api/assignments/{id}/submit` | Student Only | Mengirim berkas jawaban tugas (Proteksi otomatis deadline). |
| **POST** | `/api/submissions/{id}/grade` | Dosen Only | Menyimpan input komponen nilai (0-100) & umpan balik. |
| **POST** | `/api/attendance/session` | Dosen Only | Membuka sesi absensi virtual pertemuan tertentu (1-16). |
| **GET** | `/api/attendance/session/{id}/refresh` | Dosen Only | Menghasilkan token enkripsi QR Code baru (Setiap 15 detik). |
| **POST** | `/api/attendance/scan` | Student Only | Memvalidasi token QR hasil pindai kamera HP mahasiswa. |

---

## 8. PROJECT PLANNING, TIMELINE & ROADMAP (6 MINGGU)

Proyek dikembangkan menggunakan metodologi Agile dengan fokus pengantaran fitur inkremental setiap minggunya:

### 8.1 Minggu 1: Inisialisasi & Setup Lingkungan Kerja
- **Target Utama**: Integrasi konektivitas antar framework lokal tanpa hambatan keamanan.
- **Backend (Laravel)**: Inisialisasi Laravel 13, konfigurasi `.env`, aktivasi Laravel Sanctum, dan konfigurasi aturan CORS.
- **Frontend (Next.js)**: Setup Next.js 14 App Router, install Tailwind CSS, Axios, SWR, dan pustaka `qrcode.react`. Setup instans Axios global (`withCredentials: true`).

### 8.2 Minggu 2: Arsitektur Database & Backend Auth API
- **Target Utama**: Kestabilan struktur data inti dan keamanan hak akses API.
- **Database**: Pembuatan dan eksekusi file migrasi untuk semua tabel (`users` s.d `attendances`). Pembuatan Database Seeder untuk data akun pengujian dosen dan mahasiswa.
- **Logika API Auth**: Implementasi auth controller (login, logout, user session data) dan pembuatan kustom middleware untuk proteksi Role Dosen dan Mahasiswa.

### 8.3 Minggu 3: Integrasi Frontend Auth & Pembuatan Layout UI
- **Target Utama**: Gerbang masuk aplikasi siap pakai dan pembatasan halaman di sisi client.
- **Frontend Integration**: Implementasi kustom React hook `useAuth` berbasis SWR, perancangan form login utama beserta penanganan error validasi.
- **Layouting & Guarding**: Implementasi sistem navigasi sidebar/navbar, serta penerapan Route Guarding di Next.js untuk mencegah mahasiswa melompati URL khusus dosen.

### 8.4 Minggu 4: Pengembangan Fitur Core LMS (Materi & Tugas)
- **Target Utama**: Berjalannya alur utama distribusi modul silabus serta manajemen penugasan berkas digital.
- **Modul Materi**: Implementasi fungsi CRUD materi di sisi backend dan halaman direktori unduh yang aman di sisi frontend mahasiswa.
- **Modul Tugas**: Implementasi fungsional pembuatan tugas (Dosen) dan form drop-zone unggah lembar kerja mahasiswa dengan penguncian otomatis jika jam server melewati batas deadline.
- **Modul Nilai**: Pembuatan panel rekapitulasi tugas mahasiswa bagi dosen untuk membaca dokumen masuk dan mengirim nilai angka balik (0-100).

### 8.5 Minggu 5: Pengembangan Fitur Kritikal (Absensi QR Dinamis)
- **Target Utama**: Keberhasilan simulasi pencegahan kecurangan absen menggunakan sinkronisasi waktu token.
- **Backend Engine**: Implementasi endpoint pembuatan sesi absen, enkripsi payload data gabungan (`Crypt::encryptString`), dan algoritma verifikasi token berkala (`Hash::check`).
- **Frontend Dosen**: Pembuatan halaman proyektor kelas dengan mekanisme otomatis polling data (`setInterval`) untuk me-refresh QR Code setiap 15 detik.
- **Frontend Mahasiswa**: Implementasi halaman deteksi modul kamera HP browser (menggunakan library `html5-qrcode`) untuk memindai berkas dan mengirim string ke server.

### 8.6 Minggu 6: Optimasi, Testing Akhir, & Deployment
- **Target Utama**: Sistem bebas bug, query optimal, dan aplikasi siap diakses secara online di lingkungan kampus.
- **Optimasi**: Refactoring kode program, pembersihan query database dengan Eager Loading (`with()`) untuk membasmi masalah performa query N+1. Eksekusi `php artisan storage:link`.
- **Pengujian Skenario (UAT)**: Simulasi skenario kecurangan (pemindaian gambar screenshot QR yang usang) dan pengumpulan tugas terlambat untuk memastikan server menolak request dengan tepat.
- **Deployment**: Eksekusi `npm run build` pada Next.js, migrasi database produksi ke VPS/Cloud Server, dan penyesuaian `.env` produksi (menonaktifkan `APP_DEBUG`).

---

Dokumen Master PRD ini bersifat mengikat sebagai acuan dasar pengerjaan sistem KelasLMS. Setiap perubahan fungsional wajib melalui mekanisme persetujuan Change Request.