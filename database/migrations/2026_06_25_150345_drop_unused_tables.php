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
        Schema::dropIfExists('exported_students');
        Schema::dropIfExists('export_histories');
        Schema::dropIfExists('student_exports');
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
