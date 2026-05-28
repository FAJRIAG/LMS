# 🎓 UTN Indonesia — Learning Management System (LMS)

Platform manajemen pembelajaran modern untuk **Universitas Teknologi Nusantara (UTN) Indonesia**, dirancang untuk mendukung kegiatan akademik dosen dan mahasiswa secara real-time dengan arsitektur decoupled (Backend API + Frontend SPA).

---

## 👤 Developer

| Identitas        | Detail                        |
|------------------|-------------------------------|
| **Nama**         | Fajri Ghurri                 |
| **NIM**          | 120140081                    |
| **Program Studi**| Teknik Informatika            |
| **Kelas**        | IF-A                         |
| **Dosen Pengampu** | Dr. Budi Santoso            |

---

## 🛠️ Tech Stack

### Backend — `backend/`

| Teknologi         | Versi         | Keterangan                                         |
|-------------------|---------------|----------------------------------------------------|
| **PHP**           | `^8.3`        | Runtime utama                                      |
| **Laravel**       | `^13.8`       | Framework PHP untuk REST API                       |
| **Laravel Sanctum**| `^4.0`       | Autentikasi stateful berbasis sesi (cookie-based)  |
| **Laravel Tinker**| `^3.0`        | REPL untuk debugging via Artisan                   |
| **MySQL**         | (via MAMP)    | Database relasional utama                          |
| **PHPUnit**       | `^12.5`       | Framework pengujian unit & integrasi               |

### Frontend — `frontend/`

| Teknologi         | Versi         | Keterangan                                          |
|-------------------|---------------|-----------------------------------------------------|
| **Next.js**       | `16.2.6`      | React Framework (App Router, Turbopack)             |
| **React**         | `19.2.4`      | UI library                                          |
| **React DOM**     | `19.2.4`      | Rendering ke browser                                |
| **Axios**         | `^1.16.1`     | HTTP client untuk panggilan API backend             |
| **SWR**           | `^2.4.1`      | Data fetching + caching dengan auto-revalidation    |
| **qrcode.react**  | `^4.2.0`      | Generate QR Code untuk sesi presensi dosen          |
| **html5-qrcode**  | `^2.3.8`      | Scan QR Code via kamera perangkat mahasiswa         |
| **Tailwind CSS**  | `^4`          | Utility-first CSS framework                         |
| **ESLint**        | `^9`          | Linter JavaScript/React                             |

---

## 🏗️ Arsitektur Sistem

```
LMS/
├── backend/               # Laravel 13 REST API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/   # AuthController, MaterialController, dst.
│   │   │   └── Middleware/    # EnsureUserIsLecturer, EnsureUserIsStudent
│   │   └── Models/            # User, Classroom, Department, Material, dst.
│   ├── database/
│   │   ├── migrations/        # 11 tabel relasional
│   │   └── seeders/           # DatabaseSeeder (dept, kelas, user default)
│   └── routes/
│       └── api.php            # Endpoint API yang diproteksi Sanctum
│
└── frontend/              # Next.js 16.2.6 SPA (App Router)
    └── src/
        ├── app/
        │   ├── page.js            # Halaman Login
        │   └── dashboard/
        │       ├── layout.js          # Sidebar + Classroom Selector
        │       ├── page.js            # Dashboard Utama
        │       ├── materials/         # Manajemen Materi
        │       ├── assignments/       # Tugas & Pengumpulan
        │       └── attendance/        # Presensi (QR Generate + Scan)
        ├── context/
        │   └── ClassroomContext.js    # Global state kelas aktif
        ├── hooks/
        │   └── useAuth.js             # Hook autentikasi berbasis SWR
        └── lib/
            └── axios.js               # Konfigurasi Axios (withCredentials, CSRF)
```

---

## ⚙️ Petunjuk Instalasi & Menjalankan

### Persyaratan Sistem

- PHP `>= 8.3` + Composer
- Node.js `>= 18` + npm
- MySQL (via MAMP / XAMPP / Laragon)

---

### 1️⃣ Setup Backend (Laravel 13)

```bash
cd backend

# Install dependensi PHP
composer install

# Salin file konfigurasi
cp .env.example .env

# Sesuaikan konfigurasi database di .env:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306  (atau 8889 untuk MAMP)
# DB_DATABASE=lms
# DB_USERNAME=root
# DB_PASSWORD=root

# Generate application key
php artisan key:generate

# Jalankan migrasi & seeder
php artisan migrate:fresh --seed

# Jalankan server backend
php artisan serve --port=8000
```

---

### 2️⃣ Setup Frontend (Next.js 16)

```bash
cd frontend

# Install dependensi Node.js
npm install

# Buat file environment
cp .env.local.example .env.local
# Isi dengan:
# NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000

# Jalankan development server (Turbopack)
npm run dev
```

Buka `http://localhost:3000` di browser.

---

## 🔑 Akun Uji Coba (Default Seeder)

| Role       | Email                  | Password      |
|------------|------------------------|---------------|
| **Dosen**  | `budi@kelaslms.com`    | `password123` |
| **Mahasiswa** | `fajri@kelaslms.com` | `password123` |

---

## 🌐 Fitur Utama

- **Multi-Kelas & Multi-Jurusan** — Dosen bisa mengajar banyak kelas dari berbagai jurusan; mahasiswa terdaftar ke kelas spesifik.
- **Manajemen Materi** — Upload & download berkas terproteksi (streaming aman, tidak bisa diakses tanpa login).
- **Pratinjau PDF** — Mahasiswa dapat melihat isi berkas PDF sebelum mengunduh.
- **Tugas & Pengumpulan** — Deadline countdown, drag-and-drop upload, penilaian dosen dengan feedback.
- **Presensi QR Real-time** — Dosen generate QR Code dinamis; mahasiswa scan via kamera ponsel.
- **Dashboard Dinamis** — Sapaan berbasis waktu, statistik kelas real-time, sidebar classroom selector.

---

## 📡 Konfigurasi Penting

### Sanctum Stateful Auth (CORS)

Di `backend/.env`, pastikan domain frontend terdaftar sebagai stateful:

```env
SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
FRONTEND_URL=http://localhost:3000
```

### Variabel Lingkungan Frontend

Di `frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

---

© 2026 Universitas Teknologi Nusantara (UTN) Indonesia. All rights reserved.
