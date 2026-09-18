<?php

namespace App\Traits;

use Illuminate\Validation\ValidationException;

trait ResolvesCampusConnection
{
    /**
     * Maps each campus (as stored in the local `students`.`campus` column
     * AND as accepted from the frontend) to its SIS database connection
     * name (config/database.php).
     *
     * NOTE: only 'Talisay' => 'tal_mysql' and 'Fortune Towne' => 'ft_mysql'
     * are confirmed from earlier work. Alijis/Binalbagan connection names
     * below are placeholders — replace with the real ones.
     */
    protected const CAMPUS_CONNECTIONS = [
        'Talisay' => 'tal_mysql',
        'Alijis' => 'ali_mysql',
        'Fortune Towne' => 'ft_mysql',
        'Binalbagan' => 'bin_mysql',
    ];

    protected function connectionForCampus(string $campus): string
    {
        if (!array_key_exists($campus, self::CAMPUS_CONNECTIONS)) {
            throw ValidationException::withMessages([
                'campus' => 'Unknown campus: ' . $campus,
            ]);
        }

        return self::CAMPUS_CONNECTIONS[$campus];
    }
}