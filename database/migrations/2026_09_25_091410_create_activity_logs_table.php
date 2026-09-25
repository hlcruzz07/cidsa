<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('student_id')
                ->nullable()
                ->constrained('students')
                ->cascadeOnDelete();
            $table->string('action');
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('browser')->nullable();
            $table->string('print_type')->nullable();
            $table->timestamps();
            $table->index(['action', 'created_at']);
            $table->index(['student_id', 'action']);
            $table->index(['user_id', 'action']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};