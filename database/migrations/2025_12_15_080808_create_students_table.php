<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {


    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();

            $table->enum('id_type', ['new', 'replacement'])->default('new');
            $table->string('id_number')->unique();

            $table->string('affidavit_img')->nullable();
            $table->string('receipt_img')->nullable();

            $table->string('first_name');
            $table->string('middle_init')->nullable();
            $table->string('last_name');
            $table->string('suffix')->nullable();

            $table->string('emergency_first_name');
            $table->string('emergency_middle_init')->nullable();
            $table->string('emergency_last_name');
            $table->string('emergency_suffix')->nullable();

            $table->string('relationship');
            $table->string('contact_number');

            $table->string('province');
            $table->string('city');
            $table->string('barangay');
            $table->string('zip_code');

            $table->string('campus');
            $table->string('college');

            $table->string('program');
            $table->string('major')->nullable();
            $table->integer('year_level');
            $table->string('section');

            $table->string('picture')->nullable();
            $table->string('e_signature')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
