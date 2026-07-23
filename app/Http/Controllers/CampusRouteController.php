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
        return redirect()->route('campus.show', ['campus' => 'Talisay']);
    }

    public function dashboard()
    {
        $counts = [
            'talCounts' => $this->students->countStudentsByCampus('Talisay'),
            'aliCounts' => $this->students->countStudentsByCampus('Alijis'),
            'ftCounts' => $this->students->countStudentsByCampus('Fortune Towne'),
            'binCounts' => $this->students->countStudentsByCampus('Binalbagan'),
        ];

        return Inertia::render('dashboard', [
            'campusCounts' => $counts
        ]);
    }

    public function show(string $campus)
    {
        $validCampuses = ['Talisay', 'Alijis', 'Binalbagan', 'Fortune Towne'];

        if (!in_array($campus, $validCampuses)) {
            abort(404);
        }

        $counts = [
            'totalUpdates' => $this->students->countStudentsHasUpdatesByCampus($campus),
            'totalNewPendings' => $this->students->countNewPendingStudentByCampus($campus),
            'totalNewPrinted' => $this->students->countNewPrintedStudentByCampus($campus),
            'totalPendingReplacement' => $this->students->countReplacementPendingByCampus($campus)
        ];

        $studentsChart = $this->students->studentsUpdateChart($campus, '90d');

        // Use a single view for all campuses
        return Inertia::render('Campus/Index', [
            'campus' => $campus,
            'counts' => $counts,
            'studentsChart' => $studentsChart,
        ]);
    }
}



