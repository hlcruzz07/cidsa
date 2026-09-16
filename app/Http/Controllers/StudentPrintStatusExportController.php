<?php

namespace App\Http\Controllers;

use App\Models\PrintedStudents;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class StudentPrintStatusExportController extends Controller
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
        'Alijis' => 'ali_mysql',       // placeholder — confirm actual connection name
        'Fortune Towne' => 'ft_mysql',
        'Binalbagan' => 'bin_mysql',   // placeholder — confirm actual connection name
    ];

    protected const SCHOOL_YEAR = 2026;

    public function export(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'campus' => ['required', 'string', 'in:' . implode(',', array_keys(self::CAMPUS_CONNECTIONS))],
        ]);

        $campus = $validated['campus'];
        $connection = self::CAMPUS_CONNECTIONS[$campus];
        $schoolYear = self::SCHOOL_YEAR;

        $formatName = function (?string $last, ?string $first, ?string $middle) {
            $middleInitial = $middle ? Str::upper(Str::substr(trim($middle), 0, 1)) . '.' : '';

            return trim(collect([trim((string) $last) . ',', trim((string) $first), $middleInitial])->filter()->implode(' '));
        };

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
        // load this school year to be included at all.
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

        // 3. Build one row per SIS student, cross-checked against local data
        // and enrollment data.
        $data = $sisByStudentId->map(function ($sis, $studentId) use ($localByIdNumber, $printedByIdNumber, $enrollmentByStudentId, $collegeDescByCode, $formatName) {
            $local = $localByIdNumber->get($studentId);
            $enrollment = $enrollmentByStudentId->get($studentId);

            if (!$local) {
                $printedRecord = $printedByIdNumber->get($studentId);

                if ($printedRecord) {
                    $status = 'Printed';
                    $dateSubmitted = null; // no local submission ever existed
                    $datePrinted = $printedRecord->created_at?->format('Y-m-d H:i:s');
                } else {
                    $status = 'No Data';
                    $dateSubmitted = null;
                    $datePrinted = null;
                }
            } else {
                $printed = $local->printed;
                $status = $printed ? 'Printed' : 'Pending';
                $dateSubmitted = $local->created_at?->format('Y-m-d H:i:s');
                $datePrinted = $printed?->created_at?->format('Y-m-d H:i:s');
            }

            $collegeCode = $local?->college
                ? trim(Str::upper($local->college))
                : trim(Str::upper((string) $sis->college_code));

            $college = $collegeDescByCode->get($collegeCode) ?? 'Unassigned';

            return [
                'student_id' => $studentId,
                'last_name' => $sis->student_lastname,
                'full_name' => $formatName($sis->student_lastname, $sis->student_firstname, $sis->student_middlename),
                'program' => trim((string) $sis->program_title) ?: 'Unassigned', // <-- back to program_title
                'program_key' => trim((string) $sis->program_code) ?: 'UNASSIGNED', // <-- grouping key stays program_code
                'year_level' => $enrollment->yearlevel ?? null,
                'section' => $enrollment->section_code ?? null,
                'college' => $college,
                'status' => $status,
                'date_submitted' => $dateSubmitted,
                'date_printed' => $datePrinted,
            ];
        })->values();

        // 4. Sort by program name, year level, section, then lastname.
        $data = $data->sortBy([
            ['program', 'asc'],
            ['year_level', 'asc'],
            ['section', 'asc'],
            ['last_name', 'asc'],
        ])->values();

        // Sheets per PROGRAM, grouped on program_code.
        $byProgram = $data->groupBy('program_key');

        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);

        $headers = ['ID Number', 'Full Name', 'Program', 'Year Level', 'Section', 'Status', 'Date Printed'];

        $columnWidths = [
            'A' => 14,
            'B' => 35,
            'C' => 35,
            'D' => 12,
            'E' => 12,
            'F' => 12,
            'G' => 23,
        ];

        $asOfDate = now()->format('F j, Y');
        $campusLabel = Str::upper(str_replace(['-', '_'], ' ', $campus)); // e.g. "FORTUNE TOWNE"
        $title = "{$campusLabel} CAMPUS STUDENT STATUS LIST";

        foreach ($byProgram as $programKey => $programRows) {
            $sheet = $spreadsheet->createSheet();

            $sheetTitle = Str::limit(preg_replace('/[\\\\\/\?\*\[\]:]/', '', $programKey), 31, '');
            $sheet->setTitle($sheetTitle);

            $totalCount = $programRows->count();
            $lastCol = 'G';
            $titleRow = 1;
            $summaryRow = 2;
            $headerRow = 3;
            $firstDataRow = 4;
            $lastRow = $totalCount + $firstDataRow - 1;

            // Row 1: Title
            $sheet->setCellValue("A{$titleRow}", $title);
            $sheet->getStyle("A{$titleRow}")->getFont()->setName('Calibri')->setSize(30)->setBold(true);
            $sheet->getStyle("A{$titleRow}")->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_LEFT)
                ->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getRowDimension($titleRow)->setRowHeight(24.95);

            // Row 2: Total + As of date
            $sheet->setCellValue("A{$summaryRow}", "Total: {$totalCount}");
            $sheet->setCellValue("F{$summaryRow}", "As of {$asOfDate}");
            $sheet->getStyle("A{$summaryRow}")->getFont()->setName('Calibri')->setSize(15)->setBold(true);
            $sheet->getStyle("F{$summaryRow}")->getFont()->setName('Calibri')->setSize(15)->setBold(true);
            $sheet->getRowDimension($summaryRow)->setRowHeight(19.5);

            // Row 3: Header
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

            // Data rows (starting row 4)
            $rowNum = $firstDataRow;
            foreach ($programRows as $row) {
                $sheet->fromArray([
                    $row['student_id'],
                    $row['full_name'],
                    $row['program'],
                    $row['year_level'],
                    $row['section'],
                    $row['status'],
                    $row['date_printed'],
                ], null, "A{$rowNum}");

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
        }

        if ($spreadsheet->getSheetCount() === 0) {
            $spreadsheet->createSheet()->fromArray(['No records found'], null, 'A1');
        }

        $spreadsheet->setActiveSheetIndex(0);

        $filename = strtoupper(Str::slug($campus)) . '-STUDENT-STATUS-LIST-' . '-' . now()->format('Y-m-d') . '.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}