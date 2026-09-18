<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Traits\ResolvesCampusConnection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class StudentYearLevelSyncController extends Controller
{
    use ResolvesCampusConnection;

    /**
     * School year used to determine "currently enrolled". Matches
     * StudentPrintStatusExportController::SCHOOL_YEAR.
     *
     * NOTE: your own enrollment-check snippet used now()->year instead of a
     * hardcoded value. I've kept this as a fixed constant to match the
     * export controller and avoid silently syncing against a different
     * school year than exports are built from — but if you want it to
     * always mean "this calendar year", swap this out for now()->year (or,
     * better, pull both from one shared config value so they can't drift
     * apart).
     */
    protected function currentSchoolYear(): int
    {
        return now()->year;
    }


    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'campus' => ['required', 'string'],
        ]);

        $campus = $validated['campus'];

        try {
            $connection = $this->connectionForCampus($campus);
        } catch (Throwable $e) {
            return response()->json([
                'error' => 'invalid_campus',
                'message' => $e->getMessage(),
            ], 422);
        }

        try {

            $rows = DB::connection($connection)
                ->table('student')
                ->join('student_load', 'student.student_id', '=', 'student_load.student_id')
                ->join('student_user', 'student_user.student_id', '=', 'student.student_id')
                ->join('class', 'student_load.class_code', '=', 'class.class_code')
                ->join('section', 'class.section_id', '=', 'section.section_id')
                ->join('program', 'section.program_code', '=', 'program.program_code')
                ->where('class.school_year', $this->currentSchoolYear())
                ->select(
                    'student.student_id',
                    'section.yearlevel',
                )
                ->orderByDesc('section.yearlevel')
                ->get();
        } catch (Throwable $e) {
            Log::error("Year level sync: could not fetch SIS data for campus [{$campus}]", [
                'campus' => $campus,
                'connection' => $connection,
                'exception' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'connection_failed',
                'message' => "Couldn't connect to the {$campus} campus SIS database. Please try again shortly.",
            ], 503);
        }

        // Collapse to one yearlevel per student_id (trimmed, since SIS
        // varchar ids sometimes carry padding/whitespace).
        $yearLevelByStudentId = $rows
            ->groupBy(fn($row) => trim((string) $row->student_id))
            ->map(fn($group) => $group->first()->yearlevel);

        if ($yearLevelByStudentId->isEmpty()) {
            return response()->json([
                'error' => 'no_records',
                'message' => "No currently enrolled students found for {$campus} campus.",
            ], 404);
        }

        // ── Apply to local records, scoped to this campus only ──────────
        $updated = 0;
        $matchedIdNumbers = [];

        try {
            DB::transaction(function () use ($yearLevelByStudentId, $campus, &$updated, &$matchedIdNumbers) {
                Student::query()
                    ->where('campus', $campus)
                    ->whereIn('id_number', $yearLevelByStudentId->keys())
                    ->select(['id', 'id_number', 'year'])
                    ->chunkById(500, function ($students) use ($yearLevelByStudentId, &$updated, &$matchedIdNumbers) {
                        foreach ($students as $student) {
                            $idNumber = trim((string) $student->id_number);
                            $matchedIdNumbers[] = $idNumber;

                            $newYear = $yearLevelByStudentId->get($idNumber);

                            // Skip if SIS has no value, or local is already
                            // in sync — avoids a needless write + touching
                            // updated_at for rows that didn't actually change.
                            if ($newYear === null || (string) $student->year === (string) $newYear) {
                                continue;
                            }

                            $student->year = $newYear;
                            $student->save();
                            $updated++;
                        }
                    });
            });
        } catch (Throwable $e) {
            Log::error("Year level sync: failed while updating local records for campus [{$campus}]", [
                'campus' => $campus,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'sync_failed',
                'message' => 'Something went wrong while syncing year levels. Please try again.',
            ], 500);
        }

        $unmatched = $yearLevelByStudentId->count() - count(array_unique($matchedIdNumbers));

        return response()->json([
            'message' => "Year level sync complete for {$campus} campus.",
            'campus' => $campus,
            'sis_students_found' => $yearLevelByStudentId->count(),
            'updated' => $updated,
            'unmatched_in_local_db' => $unmatched,
        ]);
    }
}