<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\User;
use App\Models\Classroom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AttendanceController extends Controller
{
    /**
     * List all attendance sessions.
     */
    public function indexSessions(Request $request)
    {
        $request->validate([
            'classroom_id' => ['required', 'integer'],
        ]);

        $classroomId = $request->query('classroom_id');
        $user = $request->user();

        // Verify that the user has access to this classroom
        if ($user->role === 'dosen') {
            if (!$user->taughtClassrooms()->where('classrooms.id', $classroomId)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
            }
        } else {
            if (!$user->classrooms()->where('classrooms.id', $classroomId)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
            }
        }

        $sessions = AttendanceSession::where('classroom_id', $classroomId)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($sessions);
    }

    /**
     * Create a new attendance session (Lecturer only).
     */
    public function createSession(Request $request)
    {
        $request->validate([
            'classroom_id' => ['required', 'integer'],
            'meeting_number' => ['required', 'integer', 'min:1', 'max:16'],
            'topic' => ['required', 'string', 'max:150'],
        ]);

        $classroomId = $request->classroom_id;
        $user = $request->user();

        // Verify that the lecturer actually teaches this classroom
        if (!$user->taughtClassrooms()->where('classrooms.id', $classroomId)->exists()) {
            return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
        }

        $session = AttendanceSession::create([
            'user_id' => $user->id,
            'classroom_id' => $classroomId,
            'meeting_number' => $request->meeting_number,
            'topic' => $request->topic,
            'is_active' => true,
        ]);

        // Auto-initialize students enrolled in this classroom to 'alpa'
        $classroom = Classroom::findOrFail($classroomId);
        $students = $classroom->students()->where('role', 'mahasiswa')->get();

        foreach ($students as $student) {
            Attendance::updateOrCreate(
                [
                    'attendance_session_id' => $session->id,
                    'user_id' => $student->id,
                ],
                [
                    'status' => 'alpa',
                ]
            );
        }

        return response()->json($session, 201);
    }

    /**
     * Show detailed attendance list of a session.
     */
    public function showSessionDetails(AttendanceSession $attendanceSession, Request $request)
    {
        $user = $request->user();

        // Verify classroom access
        if ($user->role === 'dosen') {
            if (!$user->taughtClassrooms()->where('classrooms.id', $attendanceSession->classroom_id)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke sesi kelas ini.'], 403);
            }
        } else {
            if (!$user->classrooms()->where('classrooms.id', $attendanceSession->classroom_id)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke sesi kelas ini.'], 403);
            }
        }

        // Fixes N+1 query problem by eager loading user relationships
        $attendanceSession->load('attendances.user:id,name,nim_nip');

        return response()->json($attendanceSession);
    }

    /**
     * Refresh time-based encrypted token for dynamic QR Code (Lecturer only).
     * Invoked every 15 seconds.
     */
    public function refreshToken(AttendanceSession $attendanceSession, Request $request)
    {
        $user = $request->user();

        // Verify classroom access
        if (!$user->taughtClassrooms()->where('classrooms.id', $attendanceSession->classroom_id)->exists()) {
            return response()->json(['message' => 'Akses ditolak ke sesi kelas ini.'], 403);
        }

        if (!$attendanceSession->is_active) {
            return response()->json(['message' => 'Sesi absensi ini telah ditutup.'], 422);
        }

        // Generate dynamic cryptographical token
        $rawToken = Str::random(32);

        // Store hash and set strict 17 seconds expiration (2s latency buffer)
        $attendanceSession->update([
            'current_token' => Hash::make($rawToken),
            'expires_at' => now()->addSeconds(17),
        ]);

        // Encrypt session ID & raw token combined
        $payload = json_encode([
            'session_id' => $attendanceSession->id,
            'token' => $rawToken,
        ]);

        $encryptedPayload = Crypt::encryptString($payload);

        return response()->json([
            'qr_payload' => $encryptedPayload,
            'expires_at' => $attendanceSession->expires_at,
        ]);
    }

    /**
     * Verify QR scan payload and register presence (Student only).
     */
    public function scanQR(Request $request)
    {
        $request->validate([
            'payload' => ['required', 'string'],
        ]);

        // 1. Decrypt QR payload
        try {
            $decrypted = Crypt::decryptString($request->payload);
            $data = json_decode($decrypted, true);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Kode QR tidak dikenali atau rusak.',
                'code' => 'INVALID_QR_FORMAT'
            ], 400);
        }

        $sessionId = $data['session_id'] ?? null;
        $rawToken = $data['token'] ?? null;

        $session = AttendanceSession::find($sessionId);

        if (!$session || !$session->is_active) {
            return response()->json([
                'message' => 'Sesi absensi tidak ditemukan atau telah ditutup.',
                'code' => 'SESSION_INACTIVE'
            ], 400);
        }

        // Verify student classroom enrollment
        $user = $request->user();
        if (!$user->classrooms()->where('classrooms.id', $session->classroom_id)->exists()) {
            return response()->json([
                'message' => 'Anda tidak terdaftar di dalam kelas untuk sesi absensi ini.',
                'code' => 'CLASSROOM_MISMATCH'
            ], 403);
        }

        // 2. Strict Expiry Time Check
        if (now()->greaterThan($session->expires_at)) {
            return response()->json([
                'message' => 'Batas waktu pemindaian telah habis (QR kedaluwarsa). Silakan scan ulang.',
                'code' => 'QR_EXPIRED'
            ], 400);
        }

        // 3. Cryptographical Token Verification
        if (!Hash::check($rawToken, $session->current_token)) {
            return response()->json([
                'message' => 'Token absensi tidak valid.',
                'code' => 'INVALID_TOKEN'
            ], 400);
        }

        // 4. Update attendance status to 'hadir'
        $attendance = Attendance::updateOrCreate(
            [
                'attendance_session_id' => $session->id,
                'user_id' => $user->id,
            ],
            [
                'status' => 'hadir',
                'scanned_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Absensi berhasil diverifikasi secara real-time.',
            'attendance' => $attendance
        ]);
    }

    /**
     * Toggle session active status (Lecturer only).
     */
    public function toggleSession(AttendanceSession $attendanceSession, Request $request)
    {
        $user = $request->user();

        // Verify classroom access
        if (!$user->taughtClassrooms()->where('classrooms.id', $attendanceSession->classroom_id)->exists()) {
            return response()->json(['message' => 'Akses ditolak ke sesi kelas ini.'], 403);
        }

        $attendanceSession->update([
            'is_active' => !$attendanceSession->is_active,
        ]);

        return response()->json($attendanceSession);
    }

    /**
     * Update manual attendance status (Lecturer override, e.g. Sakit, Izin).
     */
    public function updateAttendanceStatus(Attendance $attendance, Request $request)
    {
        $user = $request->user();
        $session = $attendance->attendanceSession;

        // Verify classroom access
        if (!$user->taughtClassrooms()->where('classrooms.id', $session->classroom_id)->exists()) {
            return response()->json(['message' => 'Akses ditolak ke sesi kelas ini.'], 403);
        }

        $request->validate([
            'status' => ['required', 'in:hadir,sakit,izin,alpa'],
            'notes' => ['nullable', 'string', 'max:250'],
        ]);

        $attendance->update([
            'status' => $request->status,
            'scanned_at' => $request->status === 'hadir' ? now() : null,
            'notes' => $request->notes,
        ]);

        return response()->json($attendance);
    }

    /**
     * Delete an attendance session (Lecturer only).
     */
    public function destroy(AttendanceSession $attendanceSession, Request $request)
    {
        $user = $request->user();

        // Verify classroom access
        if (!$user->taughtClassrooms()->where('classrooms.id', $attendanceSession->classroom_id)->exists()) {
            return response()->json(['message' => 'Akses ditolak ke sesi kelas ini.'], 403);
        }

        // Attendance records are cascade deleted automatically via database schema or Eloquent
        $attendanceSession->delete();

        return response()->json(['message' => 'Sesi absensi berhasil dihapus.']);
    }
}
