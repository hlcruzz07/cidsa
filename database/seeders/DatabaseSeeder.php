<?php

namespace Database\Seeders;

use App\Enums\UserCampus;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class UserSeeder extends Seeder
{
    public function run(): void
    {

        $users = [
            [
                'name' => 'Harold Cruz',
                'email' => 'haroldlyndon.cruz@chmsu.edu.ph',
                'password' => '',
                'role' => UserRole::SUPER_ADMIN->value,
                'campus' => UserCampus::ALL->value,
            ],
            [
                'name' => 'Christian Anthony Gemelo',
                'email' => 'christian.gemelo@chmsu.edu.ph',
                'password' => '',
                'role' => UserRole::ADMIN->value,
                'campus' => UserCampus::ALL->value,
            ],
            [
                'name' => 'John Kevin Moraca',
                'email' => 'johnkevin.moraca@chmsu.edu.ph',
                'password' => '',
                'role' => UserRole::ADMIN->value,
                'campus' => UserCampus::ALL->value,
            ],
        ];

        foreach ($users as $user) {
            User::create($user);
        }
    }
}