<?php

namespace App\Repositories;

use App\Models\Student;
use App\Jobs\CreateStudentsBatchJob;
use Carbon\Carbon;
use Exception;


class StudentRepository
{
    protected $model;

    public function __construct(Student $student)
    {
        $this->model = $student;
    }

    public function all()
    {
        return $this->model->all();
    }

    public function find(int $id)
    {
        return $this->model->findOrFail($id);
    }
    public function findByStudentId(string $id_number)
    {
        return $this->model->findOrFail(['id_number' => $id_number]);
    }

    public function isStudentExisting(string $id_number, string $first_name, string $last_name): bool
    {
        return $this->model
            ->where('id_number', $id_number)
            ->where('first_name', $first_name)
            ->where('last_name', $last_name)
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
        // 🏫 Colleges
        if (!empty($filters['college']) && is_array($filters['college'])) {
            $query->whereIn('college', $filters['college']);
        }

        if (!empty($filters['is_exported'])) {
            $query->where(
                'is_exported',
                filter_var($filters['is_exported'], FILTER_VALIDATE_BOOLEAN)
            );
        }

        if (!empty($filters['is_completed'])) {
            $query->where(
                'is_completed',
                filter_var($filters['is_completed'], FILTER_VALIDATE_BOOLEAN)
            );
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

        $sort = $filters['sort'] ?? 'id';
        $order = $filters['order'] ?? 'asc';

        $query->orderBy($sort, $order);

        /* 📄 Pagination */
        $perPage = $filters['perPage'] ?? 10;

        return $query->paginate($perPage);
    }

    public function create(array $data)
    {
        $data = collect($data)->values();


        $idNumbers = $data->pluck('id_number')->all();

        $existing = Student::whereIn('id_number', $idNumbers)
            ->pluck('id_number')
            ->toArray();

        $toInsert = $data->whereNotIn('id_number', $existing)->values();
        $ignored = $data->whereIn('id_number', $existing)->values();


        $chunkSize = 500;

        $toInsert->chunk($chunkSize)->each(function ($chunk) {
            Student::insert($chunk->toArray());
        });


        return [
            'inserted' => count($toInsert) > 0 ? count($toInsert) : 0,
        ];
    }

    public function update(array $data)
    {
        $student = $this->findStudentByIdNumber(session("validated_student"));

        $campus = $data['campus'] ?? $student['campus'] ?? null;

        if (!$campus) {
            throw new Exception('Campus not specified.');
        }

        $paths = [
            'Talisay' => [
                'picture' => 'images/talisay/pictures',
                'e_signature' => 'images/talisay/signatures',
            ],
            'Alijis' => [
                'picture' => 'images/alijis/pictures',
                'e_signature' => 'images/alijis/signatures',
            ],
            'Binalbagan' => [
                'picture' => 'images/binalbagan/pictures',
                'e_signature' => 'images/binalbagan/signatures',
            ],
            'Fortune Towne' => [
                'picture' => 'images/fortune-towne/pictures',
                'e_signature' => 'images/fortune-towne/signatures',
            ],
        ];

        if (!isset($paths[$campus])) {
            throw new Exception("Invalid campus: $campus");
        }

        $picturePath = $this->storeFile($data['picture'] ?? null, $paths[$campus]['picture']);
        $signaturePath = $this->storeFile($data['e_signature'] ?? null, $paths[$campus]['e_signature']);

        $studentData = array_merge($data, [
            'picture' => $picturePath,
            'e_signature' => $signaturePath,
        ]);

        $id = $student['id'];
        $result = $this->model->findOrFail($id);

        $result->update($studentData);
        $result->save();

        $this->setCompleted($id);

        return $result;
    }

    public function filter(array $filters)
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
        // 🏫 Colleges
        if (!empty($filters['college']) && is_array($filters['college'])) {
            $query->whereIn('college', $filters['college']);
        }

        if (!empty($filters['is_exported'])) {
            $query->where(
                'is_exported',
                filter_var($filters['is_exported'], FILTER_VALIDATE_BOOLEAN)
            );
        }

        if (!empty($filters['is_completed'])) {
            $query->where(
                'is_completed',
                filter_var($filters['is_completed'], FILTER_VALIDATE_BOOLEAN)
            );
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

        $sort = $filters['sort'] ?? 'id';
        $order = $filters['order'] ?? 'asc';

        $query->orderBy($sort, $order);


        return $query->get();
    }


    protected function storeFile($file, string $folder): ?string
    {
        if (!$file) {
            return null;
        }

        // Already a path? Just return
        if (is_string($file)) {
            return $file;
        }

        // Use original file name
        $originalName = $file->getClientOriginalName();

        // Store using original name
        $file->storeAs($folder, $originalName, 'public');

        return $folder . '/' . $originalName;
    }
    public function setExported(int $id)
    {
        $student = $this->model->findOrFail($id);
        $student->is_exported = true;
        $student->save();

        return $student;
    }

    public function setCompleted(int $id)
    {
        $student = $this->model->findOrFail($id);
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
            'campus' => $data['campus'],
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

    public function countStudentsReadyForExportByCampus(string $campus): int
    {
        return $this->model
            ->where('campus', $campus)
            ->where('is_completed', true)
            ->where('is_exported', false)
            ->count();
    }

    public function countIncompleteStudentsByCampus(string $campus): int
    {
        return $this->model
            ->where('campus', $campus)
            ->where('is_completed', false)
            ->count();
    }

    public function countStudentsHasExportedByCampus(string $campus): int
    {
        return $this->model
            ->where('campus', $campus)
            ->where('is_exported', true)
            ->where('is_completed', true)
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


}
