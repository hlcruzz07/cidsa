<?php

namespace App\Http\Controllers;

use App\Repositories\StudentRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CampusRouteController extends Controller
{
    protected $students;

    public function __construct(StudentRepository $studentRepository)
    {
        $this->students = $studentRepository;
    }
    public function index()
    {
        return redirect()->route('campus.talisay');
    }

    public function talisay()
    {
        $counts = [
            'totalUpdates' => $this->students->countStudentsHasUpdatesByCampus('Talisay'),
            'readyStudents' => $this->students->countStudentsReadyForExportByCampus('Talisay'),
            'incompleteStudents' => $this->students->countIncompleteStudentsByCampus('Talisay'),
            'exportedStudents' => $this->students->countStudentsHasExportedByCampus('Talisay'),
        ];

        $studentsChart = $this->students->studentsUpdateChart('Talisay', '90d');
        return Inertia::render('Campus/Talisay/Index', [
            'counts' => $counts,
            'studentsChart' => $studentsChart,
        ]);
    }

    public function alijis()
    {
        return Inertia::render('Campus/Alijis/Index');
    }

    public function binalbagan()
    {
        return Inertia::render('Campus/Binalbagan/Index');
    }

    public function fortuneTowne()
    {
        return Inertia::render('Campus/FortuneTowne/Index');
    }
}



