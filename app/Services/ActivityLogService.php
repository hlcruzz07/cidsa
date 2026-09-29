<?php

namespace App\Services;

use App\Enums\PrintingType;
use App\Models\ActivityLog;
use App\Models\Employee;
use App\Models\Staff;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Throwable;

class ActivityLogService
{
    public function __construct(protected Request $request)
    {
    }

    /**
     * Store a log entry. Never throws: a logging failure must not break the
     * action being logged.
     *
     * Options: user (User|int|null), student (Student|int|null),
     *          employee (Employee|int|null), print_type (PrintingType|string|null)
     *
     * The user defaults to the authenticated user when none is given.
     */
    public function log(string $action, array $options = []): ?ActivityLog
    {
        try {
            return ActivityLog::create($this->attributes($action, $options));
        } catch (Throwable $e) {
            Log::error('Failed to store activity log', [
                'action' => $action,
                'exception' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function login(User|int|null $user = null): ?ActivityLog
    {
        return $this->log(ActivityLog::ACTION_LOGIN, ['user' => $user]);
    }

    /**
     * Log a single print. A Student is stored as student_id, an Employee as
     * employee_id; print_type records which kind of card was printed.
     */
    public function print(
        Student|Staff $subject,
        PrintingType|string|null $type = null,
        User|int|null $user = null,
    ): ?ActivityLog {
        return $this->log(ActivityLog::ACTION_PRINT, [
            $subject instanceof Staff ? 'employee' : 'student' => $subject,
            'print_type' => $type,
            'user' => $user,
        ]);
    }

    /**
     * Log many prints with a single bulk insert (one query per 500 rows
     * instead of one per record).
     *
     * @param iterable<Student|Staff> $subjects
     * @return int number of rows stored
     */
    public function printMany(
        iterable $subjects,
        PrintingType|string|null $type = null,
        User|int|null $user = null,
    ): int {
        try {
            $now = now();
            $rows = [];

            foreach ($subjects as $subject) {
                $rows[] = $this->attributes(ActivityLog::ACTION_PRINT, [
                    $subject instanceof Staff ? 'staff' : 'student' => $subject,
                    'print_type' => $type,
                    'user' => $user,
                ]) + ['created_at' => $now];
            }

            foreach (array_chunk($rows, 500) as $chunk) {
                ActivityLog::insert($chunk);
            }

            return count($rows);
        } catch (Throwable $e) {
            Log::error('Failed to store bulk print logs', [
                'exception' => $e->getMessage(),
            ]);

            return 0;
        }
    }

    public function export(User|int|null $user = null): ?ActivityLog
    {
        return $this->log(ActivityLog::ACTION_EXPORT, ['user' => $user]);
    }

    public function syncData(User|int|null $user = null): ?ActivityLog
    {
        return $this->log(ActivityLog::ACTION_SYNC_DATA, ['user' => $user]);
    }

    /**
     * Column values shared by log() and printMany(). Keys are always the
     * same so rows can be bulk-inserted together.
     */
    protected function attributes(string $action, array $options): array
    {
        $userAgent = $this->request->userAgent();
        $type = $options['print_type'] ?? null;

        return [
            'action' => $action,
            'user_id' => $this->resolveId($options['user'] ?? null) ?? Auth::id(),
            'student_id' => $this->resolveId($options['student'] ?? null),
            'staff_id' => $this->resolveId($options['staff'] ?? null),
            'print_type' => $type instanceof PrintingType ? $type->value : $type,
            'ip_address' => $this->request->ip(),
            'user_agent' => $userAgent ? mb_substr($userAgent, 0, 1000) : null,
            'browser' => $this->detectBrowser($userAgent),
        ];
    }

    protected function resolveId(mixed $value): ?int
    {
        if ($value === null) {
            return null;
        }

        return is_object($value) ? $value->getKey() : (int) $value;
    }

    /**
     * Lightweight browser detection (order matters: Edge/Opera/Chrome
     * all include "Chrome" or "Safari" in their user agent).
     */
    protected function detectBrowser(?string $userAgent): ?string
    {
        if (!$userAgent) {
            return null;
        }

        return match (true) {
            str_contains($userAgent, 'Edg/') => 'Edge',
            str_contains($userAgent, 'OPR/') || str_contains($userAgent, 'Opera') => 'Opera',
            str_contains($userAgent, 'Firefox/') => 'Firefox',
            str_contains($userAgent, 'Chrome/') => 'Chrome',
            str_contains($userAgent, 'Safari/') => 'Safari',
            str_contains($userAgent, 'MSIE') || str_contains($userAgent, 'Trident/') => 'Internet Explorer',
            default => 'Other',
        };
    }
}