<?php

namespace App\Http\Controllers;

use App\Exports\StudentsExport;
use App\Models\ExportHistory;
use App\Repositories\ExportRepository;
use App\Repositories\StudentRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use ZipArchive;

class ExportHistoryController extends Controller
{
    protected $studentRepository;
    protected $export;

    public function __construct(StudentRepository $studentRepository, ExportRepository $exportRepository)
    {
        $this->studentRepository = $studentRepository;
        $this->export = $exportRepository;
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
        $student_ids = (array) $request->student_ids;
        $students = $this->studentRepository->getStudetsByIds($student_ids);
        $fileName = $request->file_name;

        $zipName = $fileName . '.zip';
        $zipPath = storage_path('app/' . $zipName);

        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {

            // 1️⃣ Generate Excel file temporarily
            $excelName = 'students.xlsx';
            $excelTempPath = 'temp/' . $excelName;
            Storage::makeDirectory('temp');
            Excel::store(new StudentsExport($students), $excelTempPath);

            $zip->addFile(Storage::path($excelTempPath), $excelName);

            // 2️⃣ Loop through students
            foreach ($students as $student) {

                // Add PHOTO if exists
                if (!empty($student->picture) && Storage::disk('public')->exists($student->picture)) {
                    $zip->addFile(
                        Storage::disk('public')->path($student->picture),
                        'photos/' . basename($student->picture)
                    );
                }

                // SIGNATURE
                if (!empty($student->e_signature) && Storage::disk('public')->exists($student->e_signature)) {
                    $zip->addFile(
                        Storage::disk('public')->path($student->e_signature),
                        'signatures/' . basename($student->e_signature)
                    );
                }
            }



            $zip->close();
        }



        // Cleanup temp Excel
        Storage::delete($excelTempPath);

        // Download ZIP
        return response()->download($zipPath)->deleteFileAfterSend(true);
    }
}
