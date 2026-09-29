<?php

namespace Database\Seeders;

use App\Enums\ActivityLogType;
use App\Enums\PrintingType;
use App\Enums\UserCampus;
use App\Models\ActivityLog;
use App\Models\InventoryStock;
use App\Models\PrintedStudents;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PrintLogSeeder extends Seeder
{
    /**
     * Default number of students to mark as printed when the prompt is
     * answered with just Enter (or when running non-interactively).
     */
    private const DEFAULT_COUNT = 40;

    private const ALL_CAMPUSES = 'All campuses';

    private const USER_AGENTS = [
        ['Chrome', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'],
        ['Firefox', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0'],
        ['Edge', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 Edg/124.0'],
    ];

    public function run(): void
    {
        $campuses = $this->askCampuses();
        $count = $this->askCount(count($campuses) > 1);

        DB::transaction(function () use ($campuses, $count) {
            foreach ($campuses as $campus) {
                $this->printForCampus($campus, $count);
            }
        });
    }

    /**
     * Ask which campus to insert print logs for.
     *
     * @return UserCampus[]
     */
    private function askCampuses(): array
    {
        $all = UserCampus::cases();

        // Not running from artisan (no console), so there's nobody to ask.
        if (!$this->command) {
            return $all;
        }

        $options = array_map(fn(UserCampus $c) => $c->value, $all);

        $choice = $this->command->choice(
            'Which campus should the print logs be inserted for?',
            [...$options, self::ALL_CAMPUSES],
            0,
        );

        if ($choice === self::ALL_CAMPUSES) {
            return $all;
        }

        return array_values(array_filter(
            $all,
            fn(UserCampus $c) => $c->value === $choice
        ));
    }

    /**
     * Ask how many students to mark as printed.
     */
    private function askCount(bool $perCampus): int
    {
        if (!$this->command) {
            return self::DEFAULT_COUNT;
        }

        $question = $perCampus
            ? 'How many students should be printed PER CAMPUS?'
            : 'How many students should be printed?';

        while (true) {
            $answer = trim((string) $this->command->ask($question, (string) self::DEFAULT_COUNT));

            if (ctype_digit($answer) && (int) $answer > 0) {
                return (int) $answer;
            }

            $this->command->error('Please enter a whole number greater than 0.');
        }
    }

    private function printForCampus(UserCampus $campus, int $count): void
    {
        $printerIds = User::query()
            ->where('campus', $campus->value)
            ->pluck('id')
            ->all();

        if (empty($printerIds)) {
            $this->command?->warn("Skipped {$campus->value}: no users with this campus.");
            return;
        }

        // Students.campus may hold either the enum value or the label
        // (inventory stock rows use whichever was saved), so match both.
        $campusKeys = InventoryStock::query()
            ->pluck('campus')
            ->filter(fn($c) => UserCampus::fromLabelOrValue($c) === $campus)
            ->push($campus->value)
            ->unique()
            ->values()
            ->all();

        // Any student that exists in the students table for this campus and
        // hasn't been printed yet, picked at random.
        $students = Student::query()
            ->whereIn('campus', $campusKeys)
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('printed_students')
                    ->whereColumn('printed_students.id_number', 'students.id_number');
            })
            ->inRandomOrder()
            ->limit($count)
            ->get();

        if ($students->isEmpty()) {
            $this->command?->warn("Skipped {$campus->value}: no unprinted students found.");
            return;
        }

        if ($students->count() < $count) {
            $this->command?->warn(sprintf(
                '%s: only %d unprinted students available (requested %d).',
                $campus->value,
                $students->count(),
                $count,
            ));
        }

        foreach ($students as $student) {
            $printedAt = Carbon::instance(fake()->dateTimeBetween('-60 days', 'now'));
            [$browser, $userAgent] = fake()->randomElement(self::USER_AGENTS);

            $printed = new PrintedStudents(['id_number' => $student->id_number]);
            $printed->created_at = $printedAt;
            $printed->updated_at = $printedAt;
            $printed->save();

            $log = new ActivityLog([
                'user_id' => fake()->randomElement($printerIds),
                'student_id' => $student->id,
                'action' => ActivityLogType::PRINT ->value,
                'ip_address' => fake()->ipv4(),
                'user_agent' => $userAgent,
                'browser' => $browser,
                'print_type' => PrintingType::NEW_STUDENT->value,
            ]);
            $log->created_at = $printedAt;
            $log->updated_at = $printedAt;
            $log->save();
        }

        $this->command?->info("{$campus->value}: inserted {$students->count()} print log(s).");

        // No decrement: the activity log rows ARE the deduction.
    }
}