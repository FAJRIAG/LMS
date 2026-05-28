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
        Schema::table('materials', function (Blueprint $table) {
            $table->foreignId('classroom_id')->constrained('classrooms')->onDelete('cascade');
        });

        Schema::table('assignments', function (Blueprint $table) {
            $table->foreignId('classroom_id')->constrained('classrooms')->onDelete('cascade');
        });

        Schema::table('attendance_sessions', function (Blueprint $table) {
            $table->foreignId('classroom_id')->constrained('classrooms')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_sessions', function (Blueprint $table) {
            $table->dropForeign(['classroom_id']);
            $table->dropColumn('classroom_id');
        });

        Schema::table('assignments', function (Blueprint $table) {
            $table->dropForeign(['classroom_id']);
            $table->dropColumn('classroom_id');
        });

        Schema::table('materials', function (Blueprint $table) {
            $table->dropForeign(['classroom_id']);
            $table->dropColumn('classroom_id');
        });
    }
};
