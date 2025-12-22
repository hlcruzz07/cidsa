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

    public function filter(Request $request)
    {
        $filters = $request->only([
            'search',
            'type',
            'college',
            'year_level',
            'from',
            'to',
            'sort',
            'order',
            'perPage',
            'campus',
        ]);

        return $this->studentRepository->filter($filters);
    }
}
