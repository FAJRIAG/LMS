<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AssignmentController extends Controller
{
    /**
     * Get list of all assignments.
     */
    public function index(Request $request)
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

            // Eager load submissions counts
            $assignments = Assignment::where('classroom_id', $classroomId)
                ->withCount('submissions')
                ->with('user:id,name')
                ->orderBy('deadline_at', 'asc')
                ->get();
        } else {
            if (!$user->classrooms()->where('classrooms.id', $classroomId)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
            }

            // Eager load only this student's submission to avoid N+1 query problem
            $assignments = Assignment::where('classroom_id', $classroomId)
                ->with(['user:id,name', 'submissions' => function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                }])
                ->orderBy('deadline_at', 'asc')
                ->get();
        }

        return response()->json($assignments);
    }

    /**
     * Create a new assignment (Lecturer only).
     */
    public function store(Request $request)
    {
        $request->validate([
            'classroom_id' => ['required', 'integer'],
            'title' => ['required', 'string', 'max:150'],
            'instructions' => ['required', 'string'],
            'attachment' => ['nullable', 'file', 'max:10240'], // Max 10MB
            'deadline_at' => ['required', 'date'],
        ]);

        $classroomId = $request->classroom_id;
        $user = $request->user();

        // Verify that the lecturer actually teaches this classroom
        if (!$user->taughtClassrooms()->where('classrooms.id', $classroomId)->exists()) {
            return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
        }

        $path = null;
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('private/attachments');
        }

        $assignment = Assignment::create([
            'user_id' => $user->id,
            'classroom_id' => $classroomId,
            'title' => $request->title,
            'instructions' => $request->instructions,
            'attachment_path' => $path,
            'deadline_at' => $request->deadline_at,
        ]);

        return response()->json($assignment, 201);
    }

    /**
     * Show assignment detail.
     */
    public function show(Assignment $assignment, Request $request)
    {
        $user = $request->user();

        if ($user->role === 'dosen') {
            if (!$user->taughtClassrooms()->where('classrooms.id', $assignment->classroom_id)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
            }
            // Eager load all submissions and student profiles for grading
            $assignment->load(['user:id,name', 'submissions.user:id,name,nim_nip']);
        } else {
            if (!$user->classrooms()->where('classrooms.id', $assignment->classroom_id)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
            }
            // Eager load student's own submission
            $assignment->load(['user:id,name', 'submissions' => function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }]);
        }

        return response()->json($assignment);
    }

    /**
     * Download secure assignment attachment.
     */
    public function downloadAttachment(Assignment $assignment, Request $request)
    {
        $user = $request->user();

        // Verify classroom access
        if ($user->role === 'dosen') {
            if (!$user->taughtClassrooms()->where('classrooms.id', $assignment->classroom_id)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
            }
        } else {
            if (!$user->classrooms()->where('classrooms.id', $assignment->classroom_id)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
            }
        }

        if (!$assignment->attachment_path || !Storage::exists($assignment->attachment_path)) {
            return response()->json(['message' => 'Berkas lampiran tidak ditemukan.'], 404);
        }

        return Storage::download($assignment->attachment_path);
    }

    /**
     * Submit an assignment (Student only).
     */
    public function submit(Assignment $assignment, Request $request)
    {
        $user = $request->user();

        // Verify classroom enrollment
        if (!$user->classrooms()->where('classrooms.id', $assignment->classroom_id)->exists()) {
            return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
        }

        // 1. Strict Deadline Check
        if (now()->greaterThan($assignment->deadline_at)) {
            return response()->json([
                'message' => 'Batas waktu pengumpulan tugas telah berakhir.'
            ], 422);
        }

        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,docx,zip', 'max:10240'], // Max 10MB
            'student_notes' => ['nullable', 'string'],
        ]);

        // Upload file to secure private submissions folder
        $path = $request->file('file')->store('private/submissions');

        // Clean up old file if overwriting/re-submitting before deadline
        $existing = Submission::where('assignment_id', $assignment->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing && Storage::exists($existing->file_path)) {
            Storage::delete($existing->file_path);
        }

        $submission = Submission::updateOrCreate(
            [
                'assignment_id' => $assignment->id,
                'user_id' => $user->id,
            ],
            [
                'student_notes' => $request->student_notes,
                'file_path' => $path,
                'submitted_at' => now(),
            ]
        );

        return response()->json($submission, 200);
    }

    /**
     * Download secure student submission (Lecturer only).
     */
    public function downloadSubmission(Submission $submission, Request $request)
    {
        $user = $request->user();
        $assignment = $submission->assignment;

        // Verify that the lecturer actually teaches this classroom
        if (!$user->taughtClassrooms()->where('classrooms.id', $assignment->classroom_id)->exists()) {
            return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
        }

        if (!Storage::exists($submission->file_path)) {
            return response()->json(['message' => 'Berkas tugas mahasiswa tidak ditemukan.'], 404);
        }

        return Storage::download($submission->file_path);
    }

    /**
     * Grade student submission (Lecturer only).
     */
    public function grade(Submission $submission, Request $request)
    {
        $user = $request->user();
        $assignment = $submission->assignment;

        // Verify that the lecturer actually teaches this classroom
        if (!$user->taughtClassrooms()->where('classrooms.id', $assignment->classroom_id)->exists()) {
            return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
        }

        $request->validate([
            'grade' => ['required', 'integer', 'min:0', 'max:100'],
            'lecturer_feedback' => ['nullable', 'string'],
        ]);

        $submission->update([
            'grade' => $request->grade,
            'lecturer_feedback' => $request->lecturer_feedback,
        ]);

        return response()->json($submission);
    }
}
