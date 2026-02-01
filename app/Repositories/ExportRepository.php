<?php

namespace App\Repositories;

use App\Models\ExportedStudent;
use App\Models\ExportHistory;

class ExportRepository
{
    protected $exportHistory;
    protected $exportedStudent;


    public function __construct(ExportHistory $exportHistory, ExportedStudent $exportedStudent)
    {
        $this->exportHistory = $exportHistory;
        $this->exportedStudent = $exportedStudent;
    }

    public function addExportHistory(int $user_id, string $file_name): int
    {
        $result = $this->exportHistory->create([
            'user_id'   => $user_id,
            'file_name' => $file_name,
        ]);

        return $result->id;
    }

    public function addExportedStudent(int $export_id, int $student_id)
    {
        return $this->exportedStudent->create([
            'export_id'  => $export_id,
            'student_id' => $student_id,
        ]);
    }

    public function filterPaginate(array $filters)
    {
        $query = $this->exportHistory->query()->with([
            'user',
            'exportedStudents.student' // eager load student info
        ]);

        // 1️⃣ Filter by date range
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

        // 2️⃣ Filter by user or student info (search)
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                // Search in user name/email
                $q->whereHas('user', function ($q2) use ($search) {
                    $q2->where(function ($q3) use ($search) {
                        $q3->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
                });
            });
        }

        // 3️⃣ Sorting
        $sort = $filters['sort'] ?? 'id';
        $order = $filters['order'] ?? 'asc';
        $query->orderBy($sort, $order);

        // 4️⃣ Pagination
        $perPage = $filters['perPage'] ?? 10;
        return $query->paginate($perPage);
    }
}
