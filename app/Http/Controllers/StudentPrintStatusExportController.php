<?php

namespace App\Http\Controllers;

use App\Models\PrintedStudents;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Throwable;

class StudentPrintStatusExportController extends Controller
{
    protected function currentSchoolYear(): int
    {
        return now()->year;
    }

    protected const CAMPUS_CONNECTIONS = [
        'Talisay' => 'tal_mysql',
        'Alijis' => 'ali_mysql',       // placeholder — confirm actual connection name
        'Fortune Towne' => 'ft_mysql',
        'Binalbagan' => 'bin_mysql',   // placeholder — confirm actual connection name
    ];

    /**
     * Valid `status` values a row can have. Used to validate the
     * `statuses` export filter.
     */
    protected const STATUS_VALUES = ['Printed', 'Pending', 'No Data'];

    /**
     * Valid raw SIS year-level integers. Bump the upper bound to 5 if any
     * campus/program actually has a 5th-year curriculum.
     */
    protected const YEAR_LEVEL_MIN = 1;
    protected const YEAR_LEVEL_MAX = 4;

    protected const COLUMN_DEFINITIONS = [
        'student_id' => ['label' => 'ID Number', 'width' => 14],
        'full_name' => ['label' => 'Full Name', 'width' => 35],
        // Optional — off by default (see DEFAULT_COLUMNS) since each sheet
        // is already scoped to one program and it's named in the sheet
        // title, but some exports (e.g. flatter, unsplit lists) want it
        // spelled out per row too.
        'program' => ['label' => 'Program', 'width' => 40],
        'year_level' => ['label' => 'Year Level', 'width' => 12],
        'section' => ['label' => 'Section', 'width' => 12],
        'status' => ['label' => 'Status', 'width' => 12],
        'date_printed' => ['label' => 'Date Printed', 'width' => 23],
        'date_received' => ['label' => 'Date Received', 'width' => 28],
        'signature' => ['label' => 'Signature', 'width' => 28],
    ];
    protected const DEFAULT_COLUMNS = [
        'student_id',
        'full_name',
        'year_level',
        'section',
        'status',
        'date_printed',
    ];

    protected function formatYearLevel(int $number): string
    {
        return match ($number) {
            1 => '1st',
            2 => '2nd',
            3 => '3rd',
            4 => '4th',
            default => (string) $number,
        };
    }

    /**
     * Whether $e represents an SIS/external-database connectivity problem
     * (host down, wrong credentials, connection name missing from
     * config/database.php) as opposed to a logic bug in this method.
     */
    protected function isConnectionError(Throwable $e): bool
    {
        if ($e instanceof \PDOException) {
            return true;
        }

        if ($e instanceof \Illuminate\Database\QueryException) {
            return true;
        }

        // Thrown by Laravel's DB manager when a connection name isn't
        // defined in config/database.php at all (e.g. a still-placeholder
        // campus connection name).
        if ($e instanceof \InvalidArgumentException && str_contains($e->getMessage(), 'Database connection')) {
            return true;
        }

        return false;
    }

    public function export(Request $request): StreamedResponse|JsonResponse
    {
        $validated = $request->validate([
            'campus' => ['required', 'string', 'in:' . implode(',', array_keys(self::CAMPUS_CONNECTIONS))],
            'programs' => ['nullable', 'array'],
            'programs.*' => ['string'],
            'columns' => ['nullable', 'array'],
            'columns.*' => ['string', 'in:' . implode(',', array_keys(self::COLUMN_DEFINITIONS))],
            'statuses' => ['nullable', 'array'],
            'statuses.*' => ['string', 'in:' . implode(',', self::STATUS_VALUES)],
            // Multiple selections now (checkboxes on the frontend), as raw
            // SIS integers (1-4), not "1st Year"-style labels.
            'year_level' => ['nullable', 'array'],
            'year_level.*' => ['integer', 'between:' . self::YEAR_LEVEL_MIN . ',' . self::YEAR_LEVEL_MAX],
        ]);

        $campus = $validated['campus'];
        $connection = self::CAMPUS_CONNECTIONS[$campus];
        $schoolYear = $this->currentSchoolYear();

        // Empty/omitted = include everything for that filter.
        $selectedPrograms = $validated['programs'] ?? [];
        $selectedStatuses = $validated['statuses'] ?? [];
        $selectedYearLevels = array_map('intval', $validated['year_level'] ?? []);

        // Preserve COLUMN_DEFINITIONS order regardless of the order the
        // frontend sent the keys in.
        $requestedColumns = !empty($validated['columns']) ? $validated['columns'] : self::DEFAULT_COLUMNS;
        $orderedColumnKeys = array_values(array_filter(
            array_keys(self::COLUMN_DEFINITIONS),
            fn($key) => in_array($key, $requestedColumns, true)
        ));

        // Guard against an empty/invalid selection producing a headerless sheet.
        if (empty($orderedColumnKeys)) {
            $orderedColumnKeys = self::DEFAULT_COLUMNS;
        }

        $formatName = function (?string $last, ?string $first, ?string $middle) {
            $middleInitial = $middle ? Str::upper(Str::substr(trim($middle), 0, 1)) . '.' : '';

            return trim(collect([trim((string) $last) . ',', trim((string) $first), $middleInitial])->filter()->implode(' '));
        };

        try {
            // 0. Single source of truth for code -> description.
            $collegeDescByCode = DB::connection($connection)
                ->table('college')
                ->pluck('college_desc', 'college_code');

            // 1a. Base population: EVERY student's declared program via their
            // curriculum, regardless of whether they currently have a class load.
            $sisByStudentId = DB::connection($connection)
                ->table('student')
                ->join('curriculum_major', 'student.curriculum_major_id', '=', 'curriculum_major.curriculum_major_id')
                ->join('curriculum', 'curriculum_major.curriculum_id', '=', 'curriculum.curriculum_id')
                ->join('program', 'curriculum.program_code', '=', 'program.program_code')
                ->select(
                    'student.student_id',
                    'student.student_lastname',
                    'student.student_firstname',
                    'student.student_middlename',
                    'program.program_code',   // real grouping key
                    'program.program_title',
                    'program.college_code',
                )
                ->get()
                ->keyBy(fn($row) => trim((string) $row->student_id));

            // 1b. Current SY enrollment (year level, section) — student must have a
            // load this school year to be included at all. `yearlevel` here is a
            // raw integer (1-4) from the SIS database and is kept as an integer
            // all the way through $data and into the exported sheet — no
            // "1st Year"-style relabeling anywhere.
            $enrollmentByStudentId = DB::connection($connection)
                ->table('student_load')
                ->join('class', 'student_load.class_code', '=', 'class.class_code')
                ->join('section', 'class.section_id', '=', 'section.section_id')
                ->where('class.school_year', $schoolYear)
                ->select('student_load.student_id', 'section.yearlevel', 'section.section_code')
                ->orderByDesc('section.yearlevel')
                ->get()
                ->groupBy(fn($row) => trim((string) $row->student_id))
                ->map(fn($rows) => $rows->first());

            // 1a-filtered. Restrict to students who have a current load this SY
            // (inner-join semantics against 1b).
            $sisByStudentId = $sisByStudentId->filter(
                fn($row, $studentId) => $enrollmentByStudentId->has($studentId)
            );

            // 2. Local CIDSA requests for this campus.
            $localByIdNumber = Student::query()
                ->select(['id', 'id_number', 'college', 'created_at'])
                ->where('campus', $campus)
                ->with(['printed:id_number,created_at'])
                ->get()
                ->keyBy(fn(Student $s) => trim((string) $s->id_number));

            // 2b. Printed records looked up directly by id_number — covers students
            // with no local CIDSA submission row at all ("No Data") who were still
            // printed.
            $printedByIdNumber = PrintedStudents::query()
                ->select(['id_number', 'created_at'])
                ->get()
                ->keyBy(fn($p) => trim((string) $p->id_number));
        } catch (Throwable $e) {
            if ($this->isConnectionError($e)) {
                Log::error("SIS export: could not connect to SIS database for campus [{$campus}] (connection: {$connection})", [
                    'campus' => $campus,
                    'connection' => $connection,
                    'exception' => $e->getMessage(),
                ]);

                return response()->json([
                    'error' => 'connection_failed',
                    'message' => "Couldn't connect to the {$campus} campus SIS database. Please try again shortly.",
                ], 503);
            }

            Log::error("SIS export: unexpected error fetching data for campus [{$campus}]", [
                'campus' => $campus,
                'connection' => $connection,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'fetch_failed',
                'message' => 'Something went wrong while gathering student data for this export. Please try again.',
            ], 500);
        }

        // ── Row building + filtering (pure PHP, no external I/O) ────────
        try {
            // 3. Build one row per SIS student, cross-checked against local data
            // and enrollment data. year_level stays a raw integer here so every
            // downstream filter/sort/group/display compares/shows ints as-is.
            $data = $sisByStudentId->map(function ($sis, $studentId) use ($localByIdNumber, $printedByIdNumber, $enrollmentByStudentId, $collegeDescByCode, $formatName) {
                $local = $localByIdNumber->get($studentId);
                $enrollment = $enrollmentByStudentId->get($studentId);

                if (!$local) {
                    $printedRecord = $printedByIdNumber->get($studentId);

                    if ($printedRecord) {
                        $status = 'Printed';
                        $dateSubmitted = null; // no local submission ever existed
                        $datePrinted = $printedRecord->created_at?->format('F j, Y - g:i A');
                    } else {
                        $status = 'No Data';
                        $dateSubmitted = null;
                        $datePrinted = null;
                    }
                } else {
                    $printed = $local->printed;
                    $status = $printed ? 'Printed' : 'Pending';
                    $dateSubmitted = $local->created_at?->format('F j, Y - g:i A');
                    $datePrinted = $printed?->created_at?->format('F j, Y - g:i A');
                }

                $collegeCode = $local?->college
                    ? trim(Str::upper($local->college))
                    : trim(Str::upper((string) $sis->college_code));

                $college = $collegeDescByCode->get($collegeCode) ?? 'Unassigned';

                return [
                    'student_id' => $studentId,
                    'last_name' => $sis->student_lastname,
                    'full_name' => $formatName($sis->student_lastname, $sis->student_firstname, $sis->student_middlename),
                    // Used both for grouping/sheet-title AND, when the
                    // caller opts in via `columns`, as the "Program" cell
                    // value on each row.
                    'program' => trim((string) $sis->program_title) ?: 'Unassigned',
                    'program_key' => trim((string) $sis->program_code) ?: 'UNASSIGNED', // grouping key stays program_code
                    'year_level' => $enrollment->yearlevel !== null ? (int) $enrollment->yearlevel : null,
                    'section' => $enrollment->section_code ?? null,
                    'college' => $college,
                    'status' => $status,
                    'date_submitted' => $dateSubmitted,
                    'date_printed' => $datePrinted,
                ];
            })->values();

            // 3b. Restrict to the selected programs, if the caller narrowed the
            // export down. An empty selection means "all programs".
            if (!empty($selectedPrograms)) {
                $data = $data->filter(
                    fn($row) => in_array($row['program'], $selectedPrograms, true)
                )->values();
            }

            // 3c. Restrict to the selected statuses. Empty selection = all statuses.
            if (!empty($selectedStatuses)) {
                $data = $data->filter(
                    fn($row) => in_array($row['status'], $selectedStatuses, true)
                )->values();
            }

            // 3d. Restrict to the selected year levels (raw SIS integers, e.g.
            // [1, 3] from checkboxes). Empty selection = all year levels.
            //
            // If this filter doesn't seem to be taking effect (all year levels
            // still showing up regardless of what's checked), the request never
            // reached this branch with data — check whatever builds the request
            // params from the frontend's `yearLevels` array actually sends them
            // under the `year_level` key as an array, e.g. `year_level[]=1&year_level[]=3`.
            if (!empty($selectedYearLevels)) {
                $data = $data->filter(
                    fn($row) => in_array($row['year_level'], $selectedYearLevels, true)
                )->values();
            }

            // 4. Sort by program name, year level, section, then lastname.
            $data = $data->sortBy([
                ['program', 'asc'],
                ['year_level', 'asc'],
                ['section', 'asc'],
                ['last_name', 'asc'],
            ])->values();
        } catch (Throwable $e) {
            Log::error("SIS export: unexpected error building rows for campus [{$campus}]", [
                'campus' => $campus,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'processing_failed',
                'message' => 'Something went wrong while processing the student data for this export. Please try again.',
            ], 500);
        }

        // Nothing matched the selected filters — tell the caller instead of
        // generating a spreadsheet whose only content is a "No records
        // found" placeholder cell. The frontend treats any non-2xx export
        // response as an error and toasts $message, so this alone is enough
        // to swap the download for a toast.
        if ($data->isEmpty()) {
            return response()->json([
                'error' => 'no_records',
                'message' => 'No records found. Try other filter options.',
            ], 404);
        }

        // Sheets per PROGRAM by default. When more than one year level is
        // selected, split further into one sheet per (program, year level)
        // combination instead of mixing them together in a single sheet.
        $splitByYearLevel = count($selectedYearLevels) > 1;

        $byProgram = $data->groupBy(
            fn($row) => $splitByYearLevel
                ? $row['program_key'] . '::' . ($row['year_level'] ?? 'NA')
                : $row['program_key']
        );

        // ── Spreadsheet assembly ─────────────────────────────────────────
        // Still synchronous at this point (no output sent yet), so a
        // failure here can still be turned into a proper JSON error rather
        // than a half-written file.
        try {
            $spreadsheet = new Spreadsheet();
            $spreadsheet->removeSheetByIndex(0);

            // Build headers/widths/last-column from the selected columns, in
            // fixed COLUMN_DEFINITIONS order.
            $headers = array_map(fn($key) => self::COLUMN_DEFINITIONS[$key]['label'], $orderedColumnKeys);

            $columnWidths = [];
            foreach ($orderedColumnKeys as $index => $key) {
                $columnLetter = Coordinate::stringFromColumnIndex($index + 1);
                $columnWidths[$columnLetter] = self::COLUMN_DEFINITIONS[$key]['width'];
            }

            $lastCol = Coordinate::stringFromColumnIndex(count($orderedColumnKeys));

            // Columns with no backing data — always rendered blank for manual fill-in.
            $blankColumns = ['date_received', 'signature'];

            $asOfDate = now()->format('F j, Y');
            $campusLabel = Str::upper(str_replace(['-', '_'], ' ', $campus));

            // Used to disambiguate sheet tab names if two groups would otherwise
            // truncate to the same 31-character title.
            $usedSheetTitles = [];

            foreach ($byProgram as $groupKey => $programRows) {
                $sheet = $spreadsheet->createSheet();

                $programCode = trim((string) ($programRows->first()['program_key'] ?? 'UNASSIGNED'));
                $groupYearLevel = $splitByYearLevel ? $programRows->first()['year_level'] : null;

                // Sheet tab name: program code, plus raw year level when split.
                $sheetTitleRaw = $groupYearLevel !== null
                    ? "{$programCode}-{$this->formatYearLevel($groupYearLevel)} Year"
                    : $programCode;
                $sheetTitle = Str::limit(preg_replace('/[\\\\\/\?\*\[\]:]/', '', $sheetTitleRaw), 31, '');

                // Guard against duplicate tab names (e.g. two program codes that
                // both truncate to the same 31 chars).
                $uniqueSheetTitle = $sheetTitle;
                $suffix = 2;
                while (in_array($uniqueSheetTitle, $usedSheetTitles, true)) {
                    $uniqueSheetTitle = Str::limit($sheetTitle, 28, '') . '-' . $suffix;
                    $suffix++;
                }
                $usedSheetTitles[] = $uniqueSheetTitle;
                $sheet->setTitle($uniqueSheetTitle);

                // Row 1 title text: campus, program name + code, and (when
                // split) the raw year level — no "1st Year" relabeling.
                $title = "{$campusLabel} CAMPUS" . " ({$programCode}) STUDENT LIST";
                if ($groupYearLevel !== null) {
                    $title .= " - {$this->formatYearLevel($groupYearLevel)} YEAR";
                }

                $totalCount = $programRows->count();
                $statusCounts = $programRows->countBy('status');
                $printedCount = $statusCounts->get('Printed', 0);
                $pendingCount = $statusCounts->get('Pending', 0);
                $noDataCount = $statusCounts->get('No Data', 0);

                $titleRow = 1;
                $summaryRow = 2;
                $breakdownRow = 3;
                $headerRow = 4;
                $firstDataRow = 5;
                $lastRow = $totalCount + $firstDataRow - 1;

                // Row 1: Title
                $sheet->setCellValue("A{$titleRow}", $title);
                $sheet->getStyle("A{$titleRow}")->getFont()->setName('Calibri')->setSize(25)->setBold(true);
                $sheet->getStyle("A{$titleRow}")->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_LEFT)
                    ->setVertical(Alignment::VERTICAL_CENTER);
                $sheet->getRowDimension($titleRow)->setRowHeight(24.95);

                // Row 2: Total + As of date (As of always sits in the last
                // column, whatever that ends up being for the selected columns)
                $sheet->setCellValue("A{$summaryRow}", "Total: {$totalCount}");
                $sheet->setCellValue("{$lastCol}{$summaryRow}", "As of {$asOfDate}");
                $sheet->getStyle("A{$summaryRow}")->getFont()->setName('Calibri')->setSize(12)->setBold(true);
                $sheet->getStyle("{$lastCol}{$summaryRow}")->getFont()->setName('Calibri')->setSize(12)->setBold(true);
                $sheet->getStyle("{$lastCol}{$summaryRow}")->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getRowDimension($summaryRow)->setRowHeight(19.5);

                // Row 3: Status breakdown (Printed / Pending / No Data)
                $sheet->setCellValue("A{$breakdownRow}", "Printed: {$printedCount}");
                $sheet->setCellValue("C{$breakdownRow}", "Pending: {$pendingCount}");
                $sheet->setCellValue("E{$breakdownRow}", "No Data: {$noDataCount}");
                foreach (['A', 'C', 'E'] as $col) {
                    $sheet->getStyle("{$col}{$breakdownRow}")->getFont()->setName('Calibri')->setSize(12)->setBold(true);
                }
                $sheet->getRowDimension($breakdownRow)->setRowHeight(19.5);

                // Row 4: Header
                $sheet->fromArray($headers, null, "A{$headerRow}");
                $sheet->getRowDimension($headerRow)->setRowHeight(24.95);

                $headerStyle = $sheet->getStyle("A{$headerRow}:{$lastCol}{$headerRow}");
                $headerStyle->getFont()->setName('Calibri')->setSize(12)->setBold(false)
                    ->getColor()->setRGB('FFFFFF');
                $headerStyle->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('00B050');
                $headerStyle->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_LEFT)
                    ->setVertical(Alignment::VERTICAL_CENTER);
                $headerStyle->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

                // Data rows (starting row 5)
                $rowNum = $firstDataRow;
                foreach ($programRows as $row) {
                    $rowData = array_map(
                        function ($key) use ($row, $blankColumns) {
                            if (in_array($key, $blankColumns, true)) {
                                return null;
                            }

                            // Raw value, no formatting — including year_level,
                            // which stays whatever int is in $row.
                            return $row[$key];
                        },
                        $orderedColumnKeys
                    );

                    $sheet->fromArray($rowData, null, "A{$rowNum}");

                    $sheet->getRowDimension($rowNum)->setRowHeight(24.95);
                    $rowNum++;
                }

                $dataStyle = $sheet->getStyle("A{$firstDataRow}:{$lastCol}{$lastRow}");
                $dataStyle->getFont()->setName('Calibri')->setSize(12);
                $dataStyle->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_LEFT)
                    ->setVertical(Alignment::VERTICAL_CENTER);
                $dataStyle->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

                foreach ($columnWidths as $col => $width) {
                    $sheet->getColumnDimension($col)->setWidth($width);
                }

                // "Date Printed" varies a lot in rendered length (e.g. blank vs.
                // "September 7, 2026 - 10:00 AM"), so size it to this sheet's
                // longest actual value rather than a fixed guess.
                $datePrintedIndex = array_search('date_printed', $orderedColumnKeys, true);
                if ($datePrintedIndex !== false) {
                    $datePrintedCol = Coordinate::stringFromColumnIndex($datePrintedIndex + 1);

                    $longest = mb_strlen(self::COLUMN_DEFINITIONS['date_printed']['label']);
                    foreach ($programRows as $row) {
                        $longest = max($longest, mb_strlen((string) ($row['date_printed'] ?? '')));
                    }

                    // A little padding on top of raw character count so text
                    // isn't flush against the cell borders.
                    $sheet->getColumnDimension($datePrintedCol)->setWidth($longest + 4);
                }
            }

            // $data->isEmpty() was already handled above with an early JSON
            // response, so $byProgram is guaranteed to have at least one
            // group here — no "No records found" placeholder sheet needed.
            $spreadsheet->setActiveSheetIndex(0);
        } catch (Throwable $e) {
            Log::error("SIS export: unexpected error building spreadsheet for campus [{$campus}]", [
                'campus' => $campus,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'spreadsheet_failed',
                'message' => 'Something went wrong while generating the export file. Please try again.',
            ], 500);
        }

        $filename = strtoupper(Str::slug($campus)) . '-STUDENT-STATUS-LIST-' . '-' . now()->format('Y-m-d') . '.xlsx';

        return response()->streamDownload(function () use ($spreadsheet, $campus) {
            try {
                $writer = new Xlsx($spreadsheet);
                $writer->save('php://output');
            } catch (Throwable $e) {
                // By this point headers/streaming have already started, so
                // we can't convert this into a JSON error response — the
                // browser would just receive a truncated/corrupt .xlsx.
                // Logging here is still worthwhile so it isn't silent.
                Log::error("SIS export: failed while streaming spreadsheet for campus [{$campus}]", [
                    'campus' => $campus,
                    'exception' => $e->getMessage(),
                ]);
            }
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}