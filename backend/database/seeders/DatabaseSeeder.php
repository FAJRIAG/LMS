<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Department;
use App\Models\Classroom;
use App\Models\Material;
use App\Models\Assignment;
use App\Models\AttendanceSession;
use App\Models\Attendance;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Dosen & Mahasiswa
        $dosen = User::create([
            'name' => 'Dr. Budi Santoso',
            'email' => 'budi@kelaslms.com',
            'password' => 'password123',
            'role' => 'dosen',
            'nim_nip' => '198001012005011001',
        ]);

        $mahasiswa = User::create([
            'name' => 'Fajri Ghurri',
            'email' => 'fajri@kelaslms.com',
            'password' => 'password123',
            'role' => 'mahasiswa',
            'nim_nip' => '120140081',
        ]);

        // 2. Seed Departments
        $ifDept = Department::create([
            'name' => 'Teknik Informatika',
            'code' => 'IF',
        ]);

        $siDept = Department::create([
            'name' => 'Sistem Informasi',
            'code' => 'SI',
        ]);

        // 3. Seed Classrooms & Attach Lecturer
        $classes = [
            'IF' => ['IF-A', 'IF-B', 'IF-C', 'IF-D'],
            'SI' => ['SI-A', 'SI-B', 'SI-C', 'SI-D'],
        ];

        $classroomModels = [];

        foreach ($classes['IF'] as $name) {
            $class = Classroom::create([
                'department_id' => $ifDept->id,
                'name' => $name,
                'academic_year' => '2025/2026',
            ]);
            $classroomModels[$name] = $class;

            // Associate Lecturer Budi with IF classes
            $dosen->taughtClassrooms()->attach($class->id, [
                'subject_name' => 'Pemrograman Web SPA',
            ]);
        }

        foreach ($classes['SI'] as $name) {
            $class = Classroom::create([
                'department_id' => $siDept->id,
                'name' => $name,
                'academic_year' => '2025/2026',
            ]);
            $classroomModels[$name] = $class;

            // Associate Lecturer Budi with SI classes
            $dosen->taughtClassrooms()->attach($class->id, [
                'subject_name' => 'Arsitektur Enterprise',
            ]);
        }

        // 4. Enroll Student Fajri into IF-A and SI-A
        $classIfA = $classroomModels['IF-A'];
        $classSiA = $classroomModels['SI-A'];
        $mahasiswa->classrooms()->attach([$classIfA->id, $classSiA->id]);

        // 5. Seed initial dummy contents under IF-A classroom
        Material::create([
            'user_id' => $dosen->id,
            'classroom_id' => $classIfA->id,
            'title' => 'Pertemuan 1 - Arsitektur Web SPA',
            'description' => 'Materi pengenalan dasar arsitektur web modern, REST API, dan Stateful Session cookies.',
            'file_path' => 'private/materials/placeholder_materi.pdf',
            'file_type' => 'pdf',
        ]);

        Assignment::create([
            'user_id' => $dosen->id,
            'classroom_id' => $classIfA->id,
            'title' => 'Tugas 1 - Pembuatan API Endpoint',
            'instructions' => 'Buatlah rancangan API endpoint sederhana untuk modul pendaftaran mahasiswa.',
            'attachment_path' => null,
            'deadline_at' => now()->addDays(7),
        ]);

        $sessionIfA = AttendanceSession::create([
            'user_id' => $dosen->id,
            'classroom_id' => $classIfA->id,
            'meeting_number' => 1,
            'topic' => 'Pengenalan Arsitektur SPA & Client Guarding',
            'is_active' => false,
        ]);

        Attendance::create([
            'attendance_session_id' => $sessionIfA->id,
            'user_id' => $mahasiswa->id,
            'status' => 'hadir',
            'scanned_at' => now()->subHours(1),
            'notes' => 'Hadir via scan QR proyektor',
        ]);

        // 6. Seed initial dummy contents under SI-A classroom (Arsitektur Enterprise)
        Material::create([
            'user_id' => $dosen->id,
            'classroom_id' => $classSiA->id,
            'title' => 'Pertemuan 1 - Pengantar Arsitektur Enterprise',
            'description' => 'Konsep dasar integrasi sistem, arsitektur berbasis layanan (SOA), dan pemodelan proses bisnis organisasi.',
            'file_path' => 'private/materials/placeholder_materi.pdf',
            'file_type' => 'pdf',
        ]);

        Assignment::create([
            'user_id' => $dosen->id,
            'classroom_id' => $classSiA->id,
            'title' => 'Tugas 1 - Analisis Struktur Organisasi IT',
            'instructions' => 'Identifikasi dan buat diagram pemetaan layanan IT pada organisasi atau perusahaan pilihan Anda.',
            'attachment_path' => null,
            'deadline_at' => now()->addDays(5),
        ]);

        $sessionSiA = AttendanceSession::create([
            'user_id' => $dosen->id,
            'classroom_id' => $classSiA->id,
            'meeting_number' => 1,
            'topic' => 'Pengenalan & Teori Arsitektur Enterprise',
            'is_active' => false,
        ]);

        Attendance::create([
            'attendance_session_id' => $sessionSiA->id,
            'user_id' => $mahasiswa->id,
            'status' => 'hadir',
            'scanned_at' => now()->subHours(2),
            'notes' => 'Hadir manual oleh Dosen',
        ]);
    }
}
