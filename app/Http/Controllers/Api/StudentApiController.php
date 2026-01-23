<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\StudentRepository;
use Illuminate\Http\Request;

class StudentApiController extends Controller
{
    protected StudentRepository $studentRepository;

    public function __construct(StudentRepository $studentRepository)
    {
        $this->studentRepository = $studentRepository;
    }

    public function filterPaginate(Request $request)
    {

        $filters = $request->only([
            'search',
            'college',
            'is_exported',
            'is_completed',
            'from',
            'to',
            'sort',
            'order',
            'perPage',
            'campus',
        ]);



        return $this->studentRepository->filterPaginate($filters);
    }

    public function filter(Request $request)
    {

        $filters = $request->only([
            'search',
            'college',
            'is_exported',
            'is_completed',
            'from',
            'to',
            'sort',
            'order',
            'campus',
        ]);



        return $this->studentRepository->filter($filters);
    }

    public function studentsChart(Request $request)
    {

        $filters = $request->only([
            'campus',
            'timeRange',
        ]);



        return $this->studentRepository->studentsUpdateChart($filters['campus'], $filters['timeRange']);
    }
}
