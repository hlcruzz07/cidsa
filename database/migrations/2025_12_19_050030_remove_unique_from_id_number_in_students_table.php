<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Remove unique constraint
            $table->dropUnique(['id_number']);
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Re-add unique constraint if you rollback
            $table->unique('id_number');
        });
    }
};
