<?php

namespace App\Http\Controllers;

use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MaterialController extends Controller
{
    /**
     * Get list of all materials.
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
        } else {
            if (!$user->classrooms()->where('classrooms.id', $classroomId)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
            }
        }

        // Eager Loading 'user' (Dosen) to optimize query performance (Fixes N+1)
        $materials = Material::where('classroom_id', $classroomId)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($materials);
    }

    /**
     * Upload a new material (Lecturer only).
     */
    public function store(Request $request)
    {
        $request->validate([
            'classroom_id' => ['required', 'integer'],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'file' => ['required', 'file', 'mimes:pdf,pptx,docx', 'max:10240'], // Max 10MB
        ]);

        $classroomId = $request->classroom_id;
        $user = $request->user();

        // Verify that the lecturer actually teaches this classroom
        if (!$user->taughtClassrooms()->where('classrooms.id', $classroomId)->exists()) {
            return response()->json(['message' => 'Akses ditolak ke kelas ini.'], 403);
        }

        $file = $request->file('file');
        
        // Store in secure private storage
        $path = $file->store('materials');

        $material = Material::create([
            'user_id' => $user->id,
            'classroom_id' => $classroomId,
            'title' => $request->title,
            'description' => $request->description,
            'file_path' => $path,
            'file_type' => $file->getClientOriginalExtension(),
        ]);

        return response()->json($material, 201);
    }

    /**
     * Download secure material.
     */
    public function download(Material $material, Request $request)
    {
        $user = $request->user();

        // Verify classroom access
        if ($user->role === 'dosen') {
            if (!$user->taughtClassrooms()->where('classrooms.id', $material->classroom_id)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke berkas kelas ini.'], 403);
            }
        } else {
            if (!$user->classrooms()->where('classrooms.id', $material->classroom_id)->exists()) {
                return response()->json(['message' => 'Akses ditolak ke berkas kelas ini.'], 403);
            }
        }

        // Stream secure download from private folder
        if (!Storage::exists($material->file_path)) {
            return response()->json(['message' => 'Berkas materi tidak ditemukan.'], 404);
        }

        return Storage::download($material->file_path, $material->title . '.' . $material->file_type);
    }

    /**
     * Delete a material (Lecturer only).
     */
    public function destroy(Material $material, Request $request)
    {
        $user = $request->user();

        // Verify classroom access
        if (!$user->taughtClassrooms()->where('classrooms.id', $material->classroom_id)->exists()) {
            return response()->json(['message' => 'Akses ditolak ke berkas kelas ini.'], 403);
        }

        if (Storage::exists($material->file_path)) {
            Storage::delete($material->file_path);
        }

        $material->delete();

        return response()->json(['message' => 'Materi berhasil dihapus.']);
    }
}
