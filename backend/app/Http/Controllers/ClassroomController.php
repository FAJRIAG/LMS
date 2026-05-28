<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    /**
     * Get list of students in a classroom.
     * (Accessible by Lecturer who teaches the class, or students enrolled in it)
     */
    public function students(Classroom $classroom, Request $request)
    {
        $user = $request->user();

        // Verify that the user has access to this classroom
        if ($user->role === 'dosen') {
            if (!$user->taughtClassrooms()->where('classrooms.id', $classroom->id)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
            }
        } else {
            if (!$user->classrooms()->where('classrooms.id', $classroom->id)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
            }
        }

        // Fetch students ordered by NIM/Name
        $students = $classroom->students()
            ->select('users.id', 'users.name', 'users.email', 'users.nim_nip', 'users.role')
            ->orderBy('users.nim_nip', 'asc')
            ->orderBy('users.name', 'asc')
            ->get();

        return response()->json($students);
    }
}
