<?php

namespace App\Repositories;

use App\Models\PrintedStudents;
use App\Models\Student;
use App\Models\StudentReplacement;
use App\Services\GoogleDriveService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StudentRepository
{
    public array $paths = [
        'Talisay' => [
            'picture' => 'pictures',
            'e_signature' => 'signatures',
            'receipt' => 'receipts'
        ],
        'Alijis' => [
            'picture' => 'pictures',
            'e_signature' => 'signatures',
            'receipt' => 'receipts'
        ],
        'Binalbagan' => [
            'picture' => 'pictures',
            'e_signature' => 'signatures',
            'receipt' => 'receipts'
        ],
        'Fortune Towne' => [
            'picture' => 'pictures',
            'e_signature' => 'signatures',
            'receipt' => 'receipts'
        ],
    ];

    public function __construct(protected Student $model, protected GoogleDriveService $googleDriveService, protected PrintedStudents $printedStudents, protected StudentReplacement $studentReplacement)
    {

    }

    public function all()
    {
        return $this->model->all();
    }

    public function find(int $id)
    {
        return $this->model->findOrFail((int) $id);
    }

    public function getStudentById(string $id_number, string $campus): ?array
    {
        $connection = match (strtolower($campus)) {
            'talisay' => 'tal_mysql',
            'alijis' => 'ali_mysql',
            'fortune towne' => 'ft_mysql',
            'binalbagan' => 'bin_mysql',
            default => null,
        };

        if (!$connection) {
            return null;
        }

        $student = DB::connection($connection)
            ->table('student')
            ->select(
                'student_id',
                'student_firstname',
                'student_middlename',
                'student_lastname'
            )
            ->where('student_id', $id_number)
            ->first();

        if (!$student) {
            return null;
        }

        $suffix = null;
        $firstName = trim($student->student_firstname);

        if (preg_match('/^(.*)\s+(JR\.?|SR\.?|II|III|IV|V)$/i', $firstName, $matches)) {
            $firstName = trim($matches[1]);
            $suffix = strtoupper(rtrim($matches[2], '.')) . '.';
        }

        return [
            'student_id' => $student->student_id,
            'student_firstname' => $firstName,
            'student_middlename' => $student->student_middlename,
            'student_lastname' => $student->student_lastname,
            'suffix' => $suffix,
        ];
    }

    public function getStudetsByIds(array $ids)
    {
        return $this->model->whereIn('id', $ids)->get();
    }


    public function findByStudentId(string $id_number)
    {
        return $this->model->where('id_number', $id_number)->firstOrFail();
    }

    public function isStudentExisting(
        string $id_number,
        string $campus
    ): bool {
        $connection = match (strtolower($campus)) {
            'talisay' => 'tal_mysql',
            'alijis' => 'ali_mysql',
            'fortune towne' => 'ft_mysql',
            'binalbagan' => 'bin_mysql',
            default => null,
        };

        if (!$connection) {
            return false;
        }

        return DB::connection($connection)
            ->table('student')
            ->where('student_id', $id_number)
            ->exists();
    }

    public function isStudentCompleted(string $id_number): bool
    {
        return $this->model
            ->where('id_number', $id_number)
            ->where('is_completed', true)
            ->exists();
    }

    public function isStudentCompletedById(int $id): bool
    {
        return $this->model
            ->where('id', $id)
            ->where('is_completed', true)
            ->exists();
    }

    public function findStudentByIdNumber(string $id_number)
    {
        return $this->model
            ->where('id_number', $id_number)
            ->firstOrFail();
    }

    public function filterPaginate(array $filters)
    {
        $query = $this->model->query()
            ->where('campus', $filters['campus']);

        // 🔍 Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('id_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('suffix', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['type'])) {
            if ($filters['type'] === 'Graduate Studies') {
                $query->where(function ($q) {
                    $q->where('program', 'LIKE', 'Master%')
                        ->orWhere('program', 'LIKE', 'Doctor%')
                        ->orWhere('program', 'LIKE', 'Teacher%');
                });
            } else {
                $query->where('program', 'LIKE', 'Bachelor%');
            }
        }

        if (!empty($filters['college'])) {
            $query->where('college', $filters['college']);
        }

        if (!empty($filters['program'])) {
            $query->where('program', $filters['program']);
        }

        if (!empty($filters['major'])) {
            $query->where('major', $filters['major']);
        }

        if (!empty($filters['year'])) {
            $query->where('year', $filters['year']);
        }

        // 📋 is_completed filter — defaults to true when not explicitly set
        $isCompleted = $filters['is_completed'] ?? null;
        if (!is_null($isCompleted)) {
            $query->where(
                'is_completed',
                filter_var($isCompleted, FILTER_VALIDATE_BOOLEAN)
            );
        } else {
            // Default: only show completed students
            $query->where('is_completed', true);
        }

        // 🖨️ is_printed filter — checks existence in PrintedStudents via printed() relation
        $isPrinted = $filters['is_printed'] ?? null;
        if (!is_null($isPrinted)) {
            $printed = filter_var($isPrinted, FILTER_VALIDATE_BOOLEAN);
            if ($printed) {
                $query->whereHas('printed');
            } else {
                $query->whereDoesntHave('printed');
            }
        }

        if (!empty($filters['from']) && !empty($filters['to'])) {
            if ($filters['from'] === $filters['to']) {
                $query->whereDate('updated_at', '=', $filters['from']);
            } else {
                $query->whereBetween('updated_at', [
                    $filters['from'],
                    $filters['to'],
                ]);
            }
        }

        $sort = $filters['sort'] ?? 'updated_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        $perPage = $filters['perPage'] ?? 10;

        return $query
            ->withExists('printed')
            ->with(['printed', 'replacements'])
            ->paginate($perPage);
    }

    public function filterPaginateReplacement(array $filters)
    {
        $query = StudentReplacement::query()
            ->with('student') // eager-load student for the table
            ->whereHas('student', function ($q) use ($filters) {
                // 🏫 Campus — scoped to the student record
                $q->where('campus', $filters['campus']);

                // 🔍 Search — student fields
                if (!empty($filters['search'])) {
                    $search = $filters['search'];
                    $q->where(function ($s) use ($search) {
                        $s->where('id_number', 'like', "%{$search}%")
                            ->orWhere('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('suffix', 'like', "%{$search}%");
                    });
                }

                // 🎓 Student type (Graduate / Undergraduate)
                if (!empty($filters['type'])) {
                    if ($filters['type'] === 'Graduate Studies') {
                        $q->where(function ($s) {
                            $s->where('program', 'LIKE', 'Master%')
                                ->orWhere('program', 'LIKE', 'Doctor%')
                                ->orWhere('program', 'LIKE', 'Teacher%');
                        });
                    } else {
                        $q->where('program', 'LIKE', 'Bachelor%');
                    }
                }

                if (!empty($filters['college'])) {
                    $q->where('college', $filters['college']);
                }

                if (!empty($filters['program'])) {
                    $q->where('program', $filters['program']);
                }

                if (!empty($filters['major'])) {
                    $q->where('major', $filters['major']);
                }

                if (!empty($filters['year'])) {
                    $q->where('year', $filters['year']);
                }

                // Only show students who have completed their profile
                $q->where('is_completed', true);
            });

        // 🖨️ is_printed lives on StudentReplacement itself
        if (!is_null($filters['is_printed'] ?? null)) {
            $query->where(
                'is_printed',
                filter_var($filters['is_printed'], FILTER_VALIDATE_BOOLEAN)
            );
        }

        // 📅 Date range — on the replacement record's updated_at
        if (!empty($filters['from']) && !empty($filters['to'])) {
            if ($filters['from'] === $filters['to']) {
                $query->whereDate('created_at', '=', $filters['from']);
            } else {
                $query->whereBetween('created_at', [
                    $filters['from'],
                    $filters['to'],
                ]);
            }
        }

        // 🔃 Sort
        // Sorting on student columns requires a join; handle both cases cleanly
        $sort = $filters['sort'] ?? 'created_at';
        $order = $filters['order'] ?? 'desc';

        $studentColumns = ['id_number', 'first_name', 'last_name', 'college', 'program', 'year'];

        if (in_array($sort, $studentColumns)) {
            $query->join('students', 'students.id', '=', 'student_replacements.student_id')
                ->orderBy("students.{$sort}", $order)
                ->select('student_replacements.*'); // avoid column ambiguity
        } else {
            $query->orderBy("student_replacements.{$sort}", $order);
        }

        // 📄 Pagination
        $perPage = $filters['perPage'] ?? 10;
        return $query
            ->paginate($perPage)
            ->through(function ($replacement) {
                $replacement->receipt = $replacement->receipt
                    ? route('gdrive.image', [
                        'fileId' => $replacement->receipt,
                    ])
                    : null;

                return $replacement;
            });

    }

    public function filterPaginateAll(array $filters)
    {
        $query = $this->model->query();
        // 🔍 Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('id_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('suffix', 'like', "%{$search}%");
            });
        }

        $query->where(
            'is_completed',
            filter_var(false, FILTER_VALIDATE_BOOLEAN)
        );
        if (!empty($filters['from']) && !empty($filters['to'])) {
            if ($filters['from'] === $filters['to']) {
                $query->whereDate('created_at', '=', $filters['from']);
            } else {
                $query->whereBetween('created_at', [
                    $filters['from'],
                    $filters['to'],
                ]);
            }
        }

        $sort = $filters['sort'] ?? 'id';
        $order = $filters['order'] ?? 'desc';

        $query->orderBy($sort, $order);

        /* 📄 Pagination */
        $perPage = $filters['perPage'] ?? 10;

        return $query->paginate($perPage);
    }

    public function create(array $data)
    {
        $collection = collect($data)->values();

        if ($collection->isEmpty()) {
            return [
                'total_csv_rows' => 0,
                'existing_in_db' => 0,
                'existing_students' => [], // detailed info
                'to_insert' => 0,
                'ignored' => 0,
                'ignored_students' => [], // detailed info
            ];
        }

        // Unique ID numbers from CSV
        $idNumbers = $collection->pluck('id_number')->unique()->values();

        // Existing students in DB
        $existingIds = $this->model
            ->whereIn('id_number', $idNumbers)
            ->pluck('id_number')
            ->toArray();

        // Students to insert vs ignored
        $toInsert = $collection->whereNotIn('id_number', $existingIds)->values();
        $ignored = $collection->whereIn('id_number', $existingIds)->values();

        // Chunk insert (safe for large CSVs)
        $toInsert->chunk(500)->each(function ($chunk) {
            $this->model->insert($chunk->toArray());
        });

        // Prepare detailed info arrays
        $existingStudents = $collection
            ->whereIn('id_number', $existingIds)
            ->map(fn($student) => [
                'id_number' => $student['id_number'],
                'full_name' => trim($student['first_name'] . ' ' . ($student['middle_init'] ?? '') . ' ' . $student['last_name'] . ' ' . ($student['suffix'] ?? ''))
            ])
            ->values();

        $ignoredStudents = $ignored->map(fn($student) => [
            'id_number' => $student['id_number'],
            'full_name' => trim($student['first_name'] . ' ' . ($student['middle_init'] ?? '') . ' ' . $student['last_name'] . ' ' . ($student['suffix'] ?? ''))
        ])->values();

        return [
            'total_csv_rows' => $collection->count(),
            'existing_in_db' => count($existingIds),
            'existing_students' => $existingStudents,
            'to_insert' => $toInsert->count(),
            'ignored' => $ignored->count(),
            'ignored_students' => $ignoredStudents,
        ];
    }

    public function update(array $data, string $student_id)
    {
        $student = $this->findStudentByIdNumber($student_id);
        $id = $student['id'];
        $result = $this->model->findOrFail($id);
        $result->update($data);

        return $result;
    }

    public function updateLoadedStudent(Student $student, array $data): Student
    {
        $student->update($data);

        return $student;
    }





    public function storeFile($file, string $campus, string $typeFolder): array
    {
        return $this->googleDriveService->uploadPicture($file, $campus, $typeFolder);
    }


    public function setCompleted(int $id)
    {
        $student = $this->model->findOrFail($id);
        $student->timestamps = false;
        $student->is_completed = true;
        $student->save();

        return $student;
    }

    public function addStudent(array $data)
    {

        return $this->model->insert([
            'id_number' => $data['id_number'],
            'first_name' => $data['first_name'],
            'middle_init' => $data['middle_init'],
            'last_name' => $data['last_name'],
            'suffix' => $data['suffix'],
            'created_at' => Carbon::now(),
            'updated_at' => null,
        ]);
    }

    //Widgets Data
    public function countStudentsHasUpdatesByCampus(string $campus): int
    {
        return $this->model
            ->where('campus', $campus)
            ->whereNotNull('updated_at')
            ->count();
    }


    public function countNewPendingStudentByCampus(string $campus): int
    {
        return $this->model
            ->where('campus', $campus)
            ->whereDoesntHave('printed')
            ->count();
    }

    public function countNewPrintedStudentByCampus(string $campus): int
    {
        return $this->model
            ->where('campus', $campus)
            ->whereHas('printed')
            ->count();
    }

    public function countReplacementPendingByCampus(string $campus): int
    {
        return $this->studentReplacement
            ->where('is_printed', false)
            ->whereHas('student', function ($query) use ($campus) {
                $query->where('campus', $campus);
            })
            ->count();
    }

    public function studentsUpdateChart(string $campus, string $timeRange)
    {
        $now = Carbon::now();
        $startDate = match ($timeRange) {
            'today' => $now->copy()->startOfDay(),
            '7d' => $now->copy()->subDays(7),
            '30d' => $now->copy()->subDays(30),
            '90d' => $now->copy()->subDays(90),
            '180d' => $now->copy()->subDays(180),
            '365d' => $now->copy()->subDays(365),
            default => $now->copy(),
        };

        return $this->model
            ->where('campus', $campus)
            ->whereNotNull('updated_at')
            ->whereBetween('updated_at', [$startDate, $now])
            ->selectRaw('DATE(updated_at) as date, college, COUNT(*) as total')
            ->groupBy('date', 'college')
            ->orderBy('date')
            ->orderBy('college')
            ->get();
    }


    public function updateSingleStudent(array $data, int $id)
    {
        $student = $this->model->findOrFail($id);

        // Disable timestamps so updated_at won't be modified
        $student->timestamps = false;

        $student->update($data);

        return $student;
    }

    public function updateIncompleteStudent(array $data, int $id)
    {
        $student = $this->model->findOrFail($id);

        // Disable automatic timestamps for this operation
        $student->timestamps = false;

        $student->update([
            'first_name' => $data['first_name'],
            'middle_init' => $data['middle_init'],
            'last_name' => $data['last_name'],
            'suffix' => $data['suffix'],
            'updated_at' => null, // now this will be stored as null
        ]);

        // No need to call save() again
        return $student;
    }

    public function countStudentUpdatesPerCampus($timeRange)
    {
        $now = Carbon::now();

        $startDate = match ($timeRange) {
            '7d' => $now->copy()->subDays(7),
            '30d' => $now->copy()->subDays(30),
            '90d' => $now->copy()->subDays(90),
            default => $now->copy()->subDays(90),
        };

        $students = DB::table('students')
            ->select(
                DB::raw('DATE(updated_at) as date'),
                'campus',
                DB::raw('COUNT(*) as total')
            )
            ->where('updated_at', '>=', $startDate)
            ->groupBy('date', 'campus')
            ->orderBy('date')
            ->get();

        // Pivot data by date
        $result = [];
        foreach ($students as $row) {
            $date = $row->date;
            if (!isset($result[$date])) {
                $result[$date] = ['date' => $date];
            }
            // Map campus to key
            $campusKey = match ($row->campus) {
                'Talisay' => 'tal',
                'Alijis' => 'ali',
                'Binalbagan' => 'bin',
                'Fortune Town' => 'ft',
                default => strtolower($row->campus),
            };
            $result[$date][$campusKey] = $row->total;
        }

        return array_values($result);
    }


    public function countStudentsByCampus(string $campus): int
    {
        return $this->model->where('campus', $campus)->count() ?? 0;
    }

    public function setPendingForNew(string $id_number)
    {
        return $this->printedStudents->where('id_number', $id_number)->delete();
    }

    public function setPrintedForNew(string $id_number)
    {
        return $this->printedStudents->firstOrCreate([
            'id_number' => $id_number
        ]);
    }

    public function setPendingForReplacement(int $id)
    {
        $replacement = $this->studentReplacement->findOrFail($id);

        $replacement->update(['is_printed' => false, 'printed_at' => null]);
    }

    public function setPrintedForReplacement(int $id)
    {
        $replacement = $this->studentReplacement->findOrFail($id);

        $replacement->update([
            'is_printed' => true,
            'printed_at' => Carbon::now()
        ]);

        $id_number = $replacement->student->id_number;

        return $this->printedStudents->firstOrCreate([
            'id_number' => $id_number,
        ]);
    }




}
