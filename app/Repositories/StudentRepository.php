<?php

namespace App\Repositories;

use App\Models\Student;
use App\Jobs\CreateStudentsBatchJob;
use Carbon\Carbon;

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

    public function filter(array $filters)
    {
        $query = $this->model->query()
            ->where('campus', $filters['campus'] ?? 'Talisay');

        // 🔍 Search
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('id_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        // 🆔 ID Type
        if (!empty($filters['type'])) {
            $query->where('id_type', $filters['type']);
        }

        // 🏫 Colleges
        if (!empty($filters['college']) && is_array($filters['college'])) {
            $query->whereIn('college', $filters['college']);
        }

        // 🎓 Year Levels
        if (!empty($filters['year_level']) && is_array($filters['year_level'])) {
            $query->whereIn('year_level', $filters['year_level']);
        }

        // 📅 Date Range
        if (!empty($filters['from']) || !empty($filters['to'])) {
            if (!empty($filters['from'])) {
                $query->whereDate(
                    'created_at',
                    '>=',
                    Carbon::parse($filters['from'])->startOfDay()
                );
            }

            if (!empty($filters['to'])) {
                $query->whereDate(
                    'created_at',
                    '<=',
                    Carbon::parse($filters['to'])->endOfDay()
                );
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

        $queue = config('queue.default') !== 'sync';


        $data['affidavit_img'] = $this->storeFile($data['affidavit_img'] ?? null, 'students/affidavits');
        $data['receipt_img'] = $this->storeFile($data['receipt_img'] ?? null, 'students/receipts');
        $data['picture'] = $this->storeFile($data['picture'] ?? null, 'students/pictures');
        $data['e_signature'] = $this->storeFile($data['e_signature'] ?? null, 'students/signatures');

        $data = collect($data)->except(['confirm_info', 'data_privacy', 'college_name', 'hasMajor'])->toArray();

        if ($queue) {
            CreateStudentsBatchJob::dispatch([$data]);
            return null;
        }

        return $this->model->create($data);
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
}
