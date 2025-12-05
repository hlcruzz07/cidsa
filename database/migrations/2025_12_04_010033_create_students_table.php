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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('id_type');
            $table->string('id_number')->unique();
            $table->string('first_name');
            $table->string('middle_init')->nullable();
            $table->string('last_name');
            $table->string('emergency_first_name');
            $table->string('emergency_middle_init')->nullable();
            $table->string('emergency_last_name');
            $table->string('relationship');
            $table->string('contact_number', 10);
            $table->string('province');
            $table->string('city');
            $table->string('barangay');
            $table->string('zip_code', 4);
            $table->string('campus');
            $table->string('college');
            $table->string('program');
            $table->string('major')->nullable();
            $table->integer('year_level');
            $table->string('section');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
