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
        $counts = [
            'totalUpdates' => $this->students->countStudentsHasUpdatesByCampus('Alijis'),
            'readyStudents' => $this->students->countStudentsReadyForExportByCampus('Alijis'),
            'incompleteStudents' => $this->students->countIncompleteStudentsByCampus('Alijis'),
            'exportedStudents' => $this->students->countStudentsHasExportedByCampus('Alijis'),
        ];

        $studentsChart = $this->students->studentsUpdateChart('Alijis', '90d');
        return Inertia::render('Campus/Alijis/Index', [
            'counts' => $counts,
            'studentsChart' => $studentsChart,
        ]);
    }

    public function binalbagan()
    {
        $counts = [
            'totalUpdates' => $this->students->countStudentsHasUpdatesByCampus('Binalbagan'),
            'readyStudents' => $this->students->countStudentsReadyForExportByCampus('Binalbagan'),
            'incompleteStudents' => $this->students->countIncompleteStudentsByCampus('Binalbagan'),
            'exportedStudents' => $this->students->countStudentsHasExportedByCampus('Binalbagan'),
        ];

        $studentsChart = $this->students->studentsUpdateChart('Binalbagan', '90d');
        return Inertia::render('Campus/Binalbagan/Index', [
            'counts' => $counts,
            'studentsChart' => $studentsChart,
        ]);
    }

    public function fortuneTowne()
    {
        $counts = [
            'totalUpdates' => $this->students->countStudentsHasUpdatesByCampus('Fortune Towne'),
            'readyStudents' => $this->students->countStudentsReadyForExportByCampus('Fortune Towne'),
            'incompleteStudents' => $this->students->countIncompleteStudentsByCampus('Fortune Towne'),
            'exportedStudents' => $this->students->countStudentsHasExportedByCampus('Fortune Towne'),
        ];

        $studentsChart = $this->students->studentsUpdateChart('Fortune Towne', '90d');
        return Inertia::render('Campus/FortuneTowne/Index', [
            'counts' => $counts,
            'studentsChart' => $studentsChart,
        ]);
    }
}



