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
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->string('picture');
            $table->string('e_signature');
            $table->string('digital_id')->unique();
            $table->string('name');
            $table->string('campus');
            $table->string('blood_type')->nullable();
            $table->string('department');
            $table->string('designation');
            $table->string('emergency_fname');
            $table->string('emergency_mname')->nullable();
            $table->string('emergency_lname');
            $table->string('emergency_suffix')->nullable();
            $table->string('emergency_phone');
            $table->string('emergency_address');
            $table->timestamp('printed_at')->nullable()->default(null);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
