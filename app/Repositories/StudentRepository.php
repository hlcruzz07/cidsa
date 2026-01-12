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

    public function filterPaginate(array $filters)
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

        $paths = [
            'Talisay' => [
                'affidavit_img' => 'images/talisay/affidavits',
                'receipt_img' => 'images/talisay/receipts',
                'picture' => 'images/talisay/pictures',
                'e_signature' => 'images/talisay/signatures',
            ],
            'Alijis' => [
                'affidavit_img' => 'images/alijis/affidavits',
                'receipt_img' => 'images/alijis/receipts',
                'picture' => 'images/alijis/pictures',
                'e_signature' => 'images/alijis/signatures',
            ],
            'Binalbagan' => [
                'affidavit_img' => 'images/binalbagan/affidavits',
                'receipt_img' => 'images/binalbagan/receipts',
                'picture' => 'images/binalbagan/pictures',
                'e_signature' => 'images/binalbagan/signatures',
            ],
            'Fortune Towne' => [
                'affidavit_img' => 'images/fortune-towne/affidavits',
                'receipt_img' => 'images/fortune-towne/receipts',
                'picture' => 'images/fortune-towne/pictures',
                'e_signature' => 'images/fortune-towne/signatures',
            ],
        ];

        $campus = $data['campus'] ?? null;

        if (!isset($paths[$campus])) {
            throw new \InvalidArgumentException('Invalid campus selected.');
        }

        foreach (['affidavit_img', 'receipt_img', 'picture', 'e_signature'] as $field) {
            $data[$field] = $this->storeFile(
                $data[$field] ?? null,
                $paths[$campus][$field]
            );
        }

        $data = collect($data)
            ->except(['confirm_info', 'data_privacy', 'hasMajor'])
            ->toArray();

        if ($queue) {
            CreateStudentsBatchJob::dispatch([$data]);
            return null;
        }

        return $this->model->create($data);
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
}
