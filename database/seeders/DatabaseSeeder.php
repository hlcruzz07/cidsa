<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {

        User::firstOrCreate(
            ['email' => 'haroldlyndon.cruz@chmsu.edu.ph'],
            [
                'name' => 'Harold Cruz',
                'password' => null,
                'email_verified_at' => now(),
                'role' => 'super admin',
                'campus' => 'all'
            ]
        );


    }
}
