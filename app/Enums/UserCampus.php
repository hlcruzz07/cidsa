<?php

namespace App\Enums;

enum UserCampus: string
{
    case ALL = 'all';
    case TALISAY = 'tal';
    case ALIJIS = 'ali';
    case FORTUNE_TOWNE = 'ft';
    case BINALBAGAN = 'bin';

    public function label(): string
    {
        return match ($this) {
            self::ALL => 'All Campuses',
            self::TALISAY => 'Talisay',
            self::ALIJIS => 'Alijis',
            self::FORTUNE_TOWNE => 'Fortune Towne',
            self::BINALBAGAN => 'Binalbagan',
        };
    }

    /**
     * Resolve an incoming value — either a stored code ("ft") or a
     * display label ("Fortune Towne") — into its canonical enum case.
     * Case-insensitive, trims whitespace.
     */
    public static function fromLabelOrValue(string $value): ?self
    {
        $normalized = strtolower(trim($value));

        foreach (self::cases() as $case) {
            if (strtolower($case->value) === $normalized || strtolower($case->label()) === $normalized) {
                return $case;
            }
        }

        return null;
    }
}