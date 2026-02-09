<?php

namespace App\Http\Controllers;

use App\Exports\StudentsExport;
use App\Models\ExportHistory;
use App\Repositories\ExportRepository;
use App\Repositories\StudentRepository;
use App\Services\GoogleDriveService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use ZipArchive;

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
        $student_ids = (array) $request->student_ids;
        $students = $this->studentRepository->getStudetsByIds($student_ids);
        $fileName = $request->file_name;

        $zipName = $fileName . '.zip';
        $zipPath = storage_path('app/' . $zipName);

        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return response()->json(['error' => 'Could not create ZIP file.'], 500);
        }

        // 1️⃣ Generate Excel file temporarily
        $excelName = 'students.xlsx';
        $excelTempPath = 'temp/' . $excelName;

        Storage::makeDirectory('temp');
        Excel::store(new StudentsExport($students), $excelTempPath);

        $zip->addFile(Storage::path($excelTempPath), $excelName);

        // 2️⃣ Loop through students
        foreach ($students as $student) {

            // 📸 PHOTO
            if (!empty($student->picture)) {
                try {
                    if (preg_match('/^[a-zA-Z0-9_-]{25,}$/', $student->picture)) {
                        // Google Drive ID
                        $photoContent = $this->googleDriveService->getFileContent($student->picture);
                    } else {
                        // Local storage
                        if (Storage::disk('public')->exists($student->picture)) {
                            $photoContent = Storage::disk('public')->get($student->picture);
                        } else {
                            continue;
                        }
                    }

                    if (!empty($photoContent)) {
                        $photoName = $student->id_number . '.jpg';
                        $zip->addFromString('photos/' . $photoName, $photoContent);
                    }
                } catch (\Exception $e) {
                    \Log::warning("Failed to fetch photo for student {$student->id}: {$e->getMessage()}");
                }
            }

            // ✍️ SIGNATURE
            if (!empty($student->e_signature)) {
                try {
                    if (preg_match('/^[a-zA-Z0-9_-]{25,}$/', $student->e_signature)) {
                        // Google Drive ID
                        $signatureContent = $this->googleDriveService->getFileContent($student->e_signature);
                    } else {
                        // Local storage
                        if (Storage::disk('public')->exists($student->e_signature)) {
                            $signatureContent = Storage::disk('public')->get($student->e_signature);
                        } else {
                            continue;
                        }
                    }

                    if (!empty($signatureContent)) {
                        $signatureName = $student->id_number . '.bmp';
                        $zip->addFromString('signatures/' . $signatureName, $signatureContent);
                    }
                } catch (\Exception $e) {
                    \Log::warning("Failed to fetch signature for student {$student->id}: {$e->getMessage()}");
                }
            }
        }

        $zip->close();

        // Cleanup temp Excel
        Storage::delete($excelTempPath);

        // Download ZIP
        return response()->download($zipPath)->deleteFileAfterSend(true);
    }
}
