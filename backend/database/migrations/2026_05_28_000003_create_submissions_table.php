<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
