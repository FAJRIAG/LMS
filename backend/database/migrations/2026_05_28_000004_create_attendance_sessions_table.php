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
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // ID Dosen
            $table->unsignedTinyInteger('meeting_number'); // Pertemuan ke- (1 - 16)
            $table->string('topic', 150);
            $table->string('current_token')->nullable(); // Token enkripsi QR yang aktif
            $table->timestamp('expires_at')->nullable(); // Batas kedaluwarsa token QR
            $table->boolean('is_active')->default(true); // Status buka/tutup absensi
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_sessions');
    }
};
