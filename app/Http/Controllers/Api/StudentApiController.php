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
            'program',
            'major',
            'section',
            'year',
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

    public function filterExport(Request $request)
    {

        $filters = $request->only([

            'campus',
            'search',
            'college',
            'program',
            'major',
            'section',
            'year',
            'is_exported',
            'is_completed',
            'from',
            'to',
            'sort',
            'order',
            'limit'
        ]);

        return $this->studentRepository->filterExport($filters);
    }

    public function isStudentsExport(Request $request)
    {
        $filters = $request->only([
            'campus',
            'search',
            'college',
            'program',
            'major',
            'section',
            'year',
            'is_exported',
            'is_completed',
            'from',
            'to',
        ]);

        $result = $this->studentRepository->isStudentsCanExport($filters);

        return response()->json($result);
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
