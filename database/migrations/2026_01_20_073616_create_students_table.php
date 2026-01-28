<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {


    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('id_number')->unique();
            $table->string('picture')->nullable();
            $table->string('e_signature')->nullable();
            $table->string('first_name');
            $table->string('middle_init')->nullable();
            $table->string('last_name');
            $table->string('suffix')->nullable();
            $table->string('emergency_first_name')->nullable();
            $table->string('emergency_middle_init')->nullable();
            $table->string('emergency_last_name')->nullable();
            $table->string('emergency_suffix')->nullable();
            $table->string('relationship')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('province')->nullable();
            $table->string('city')->nullable();
            $table->string('barangay')->nullable();
            $table->string('zip_code')->nullable();
            $table->enum('campus', ['Talisay', 'Binalbagan', 'Alijis', 'Fortune Towne'])->nullable();
            $table->string('college')->nullable();
            $table->string('college_name')->nullable();
            $table->string('program')->nullable();
            $table->string('major')->nullable();
            $table->enum('year', ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'])->nullable();
            $table->string('section')->nullable();
            $table->boolean('is_exported')->default(false);
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
