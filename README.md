# 🎓 UTN Indonesia LMS — Learning Management System

LMS (Learning Management System) **Universitas Teknologi Nusantara (UTN) Indonesia** adalah platform manajemen pembelajaran modern yang dirancang khusus untuk mendukung kegiatan akademik secara efisien, interaktif, dan real-time. Aplikasi ini dibangun menggunakan arsitektur modern berkinerja tinggi yang memisahkan backend API dan frontend visual.

---

## 👤 Developer Profile
- **Nama Mahasiswa**: Fajri Ghurri
- **NIM**: 120140081
- **Program Studi**: Teknik Informatika
- **Kelas**: IF-A
- **Dosen Pengampu**: Dr. Budi Santoso

---

## 🛠️ Tech Stack & Architecture

Aplikasi ini menggunakan pendekatan **Decoupled Architecture** (Pemisahan Backend & Frontend):

### 1. Backend (API & Business Logic)
- **Framework**: Laravel 11
- **Autentikasi**: Laravel Sanctum (Stateful Session-based Authentication)
- **Database**: MySQL (di-host via MAMP)
- **Fitur Utama**:
  - Manajemen Multi-Kelas & Distribusi Materi
  - Pengumpulan Tugas & Monitoring Presensi Kelas Real-time
  - API Berkinerja Tinggi & Secure File Streaming (Mencegah unduhan file tanpa hak akses)

### 2. Frontend (User Interface & Experience)
- **Framework**: Next.js 16.2.6 (React 19, Turbopack)
- **Styling**: Vanilla CSS Modern dengan variabel CSS custom (Tanpa Tailwind UI Template AI)
- **Desain & Estetika**:
  - **Premium Dark Mode & Visuals**: Skema warna HSL premium, sidebar ambient, visual glassmorphism.
  - **Dynamic Sidebar**: Avatar inisial dinamis dengan indikator warna status online.
  - **Dashboard Cerdas**: Sapaan berbasis waktu yang dipersonalisasi, card statistik interaktif.
  - **File Viewer**: Fitur pratinjau PDF bawaan yang aman bagi mahasiswa sebelum mengunduh berkas.
  - **Drag-and-Drop Area**: Antarmuka unggah materi dosen yang interaktif dengan indikator jenis file dinamis.
  - **Countdown Box**: Timer hitung mundur pengumpulan tugas yang adaptif.

---

## ⚙️ Petunjuk Pemasangan & Menjalankan Aplikasi

### Persyaratan Sistem
- PHP >= 8.2
- Composer
- Node.js >= 18
- MySQL (XAMPP / MAMP / Laragon)

---

### Langkah 1: Setup Backend (Laravel)

1. Masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Instal semua dependensi PHP:
   ```bash
   composer install
   ```
3. Salin berkas konfigurasi lingkungan:
   ```bash
   cp .env.example .env
   ```
4. Sesuaikan konfigurasi database Anda di dalam berkas `.env` (misalnya `DB_DATABASE=lms`, sesuaikan port MAMP jika perlu).
5. Generate application key:
   ```bash
   php artisan key:generate
   ```
6. Jalankan migrasi database beserta data awal (seeder):
   ```bash
   php artisan migrate:fresh --seed
   ```
7. Jalankan server Laravel:
   ```bash
   php artisan serve --port=8000
   ```

---

### Langkah 2: Setup Frontend (Next.js)

1. Masuk ke folder frontend:
   ```bash
   cd ../frontend
   ```
2. Instal semua dependensi Node.js:
   ```bash
   npm install
   ```
3. Buat berkas `.env.local` untuk konfigurasi API backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Jalankan aplikasi frontend dalam mode development:
   ```bash
   npm run dev
   ```
5. Buka `http://localhost:3000` pada peramban Anda.

---

## 🔑 Akun Uji Coba (Default Seeded Users)
Gunakan akun berikut untuk menguji sistem setelah menjalankan seeder:

*   **Dosen (Lecturer)**
    *   **Email**: `budi@kelaslms.com`
    *   **Password**: `password` (atau password default Laravel seeder)
*   **Mahasiswa (Student)**
    *   **Email**: `fajri@kelaslms.com`
    *   **Password**: `password` (atau password default Laravel seeder)

---

## 📁 Struktur Direktori
```text
LMS/
├── backend/            # Laravel 11 Backend API
├── frontend/           # Next.js 16.2.6 Frontend Web App
├── .gitignore          # Root Git Ignore Configuration
├── README.md           # Dokumentasi Utama Proyek
└── Plan.md             # Dokumen Rencana Implementasi
```

---
© 2026 Universitas Teknologi Nusantara (UTN) Indonesia. All rights reserved.
