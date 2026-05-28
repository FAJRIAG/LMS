<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\AttendanceController;

// --- RUTE PUBLIK ---
Route::post('/login', [AuthController::class, 'login']);
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

// --- RUTE TERPROTEKSI SANCTUM ---
Route::middleware('auth:sanctum')->group(function () {
    
    // Autentikasi & Sesi
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    // Modul Materi Kuliah (Akses Global)
    Route::get('/materials', [MaterialController::class, 'index']);
    Route::get('/materials/{material}/download', [MaterialController::class, 'download']);

    // Modul Tugas & Penugasan (Akses Global)
    Route::get('/assignments', [AssignmentController::class, 'index']);
    Route::get('/assignments/{assignment}', [AssignmentController::class, 'show']);
    Route::get('/assignments/{assignment}/download', [AssignmentController::class, 'downloadAttachment']);

    // Modul Absensi Sesi (Akses Global)
    Route::get('/attendance/session', [AttendanceController::class, 'indexSessions']);
    Route::get('/attendance/session/{attendance_session}', [AttendanceController::class, 'showSessionDetails']);

    // --- RUTE KHUSUS DOSEN (LECTURER ONLY) ---
    Route::middleware('dosen')->group(function () {
        // CRUD Materi
        Route::post('/materials', [MaterialController::class, 'store']);
        Route::delete('/materials/{material}', [MaterialController::class, 'destroy']);

        // CRUD Tugas & Grading
        Route::post('/assignments', [AssignmentController::class, 'store']);
        Route::get('/submissions/{submission}/download', [AssignmentController::class, 'downloadSubmission']);
        Route::post('/submissions/{submission}/grade', [AssignmentController::class, 'grade']);

        // Absensi QR Dinamis (Lecturer Control)
        Route::post('/attendance/session', [AttendanceController::class, 'createSession']);
        Route::get('/attendance/session/{attendance_session}/refresh', [AttendanceController::class, 'refreshToken']);
        Route::post('/attendance/session/{attendance_session}/toggle', [AttendanceController::class, 'toggleSession']);
        Route::post('/attendance/{attendance}/manual', [AttendanceController::class, 'updateAttendanceStatus']);
    });

    // --- RUTE KHUSUS MAHASISWA (STUDENT ONLY) ---
    Route::middleware('mahasiswa')->group(function () {
        // Pengumpulan Tugas (Sebelum deadline)
        Route::post('/assignments/{assignment}/submit', [AssignmentController::class, 'submit']);

        // Pemindaian Absensi HP
        Route::post('/attendance/scan', [AttendanceController::class, 'scanQR']);
    });
});
