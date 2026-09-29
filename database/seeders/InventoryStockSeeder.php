<?php

namespace Database\Seeders;

use App\Models\InventoryStock;
use Illuminate\Database\Seeder;

class InventoryStockSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $campuses = [
            'Talisay',
            'Alijis',
            'Fortune Towne',
            'Binalbagan',
        ];

        foreach ($campuses as $campus) {
            InventoryStock::updateOrCreate(
                [
                    'campus' => $campus,
                ],
                [
                    'campus' => $campus,
                ]
            );
        }
    }
}