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
        Schema::table('exported_students', function (Blueprint $table) {
            // Drop the existing foreign key
            $table->dropForeign(['export_id']);

            // Add the new foreign key
            $table->foreign('export_id')
                ->references('id')
                ->on('student_exports')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exported_students', function (Blueprint $table) {
            // Remove the new foreign key
            $table->dropForeign(['export_id']);

            // Restore the original foreign key
            $table->foreign('export_id')
                ->references('id')
                ->on('export_histories');
        });
    }
};