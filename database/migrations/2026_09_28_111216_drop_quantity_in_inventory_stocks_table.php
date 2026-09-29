<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('inventory_stocks', function (Blueprint $table) {
            $table->dropColumn('quantity');
        });

        // Speeds up the "count prints per campus" query.
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index(['action', 'user_id', 'created_at'], 'activity_logs_action_user_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('activity_logs_action_user_created_idx');
        });

        Schema::table('inventory_stocks', function (Blueprint $table) {
            $table->unsignedInteger('quantity')->default(0);
        });
    }
};