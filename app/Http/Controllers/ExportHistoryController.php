<?php

namespace App\Http\Controllers;

use App\Jobs\ExportStudentsJob;
use App\Models\StudentExport;
use App\Repositories\ExportRepository;
use App\Repositories\StudentRepository;
use App\Services\GoogleDriveService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExportHistoryController extends Controller
{
    protected $studentRepository;
    protected $export;
    protected $googleDriveService;

    public function __construct(StudentRepository $studentRepository, ExportRepository $exportRepository, GoogleDriveService $googleDriveService)
    {
        $this->studentRepository = $studentRepository;
        $this->export = $exportRepository;
        $this->googleDriveService = $googleDriveService;
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('ExportHistory/Index');
    }

    public function view()
    {
        return Inertia::render('ExportHistory/View/Index');
    }

    public function exportStudents(Request $request)
    {
        $studentIds = (array) $request->input('student_ids', []);
        $fileName = $request->input('file_name', 'students');

        if (empty($studentIds)) {
            return response()->json([
                'message' => 'No students selected for export.',
            ], 422);
        }

        $export = StudentExport::create([
            'user_id' => $request->user()->id,
            'file_name' => $fileName,
            'status' => 'pending',
        ]);

        ExportStudentsJob::dispatch($studentIds, $export->id, $fileName);

        return response()->json([
            'message' => 'Export started.',
            'export_id' => $export->id,
        ]);
    }
}
