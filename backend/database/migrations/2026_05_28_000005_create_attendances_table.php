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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
