<?php

namespace App\Enums;

enum PrintingType: string
{
    case NEW_STUDENT = 'new_student';
    case REPLACEMENT_STUDENT = 'replacement_student';
    case EMPLOYEE = 'employee';

    public function label(): string
    {
        return match ($this) {
            self::NEW_STUDENT => 'New Student',
            self::REPLACEMENT_STUDENT => 'Replacement (Student)',
            self::EMPLOYEE => 'Employee',
        };
    }

    public function isEmployee(): bool
    {
        return $this === self::EMPLOYEE;
    }

    /** @return string[] */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}