<?php

namespace App\Http\Controllers;

use App\Exports\StudentsExport;
use App\Http\Requests\Registration\Step1Request;
use App\Http\Requests\Registration\Step2Request;
use App\Http\Requests\Registration\Step3Request;
use App\Models\Student;
use App\Repositories\StudentRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use ZipArchive;

class StudentController extends Controller
{

    protected $students;

    public function __construct(StudentRepository $studentRepository)
    {
        $this->students = $studentRepository;
    }
    public function index()
    {
        return Inertia::render('Home/Index');
    }

    public function validateStepOne(Step1Request $request)
    {
        return back()->with('success', 'Step one completed');
    }

    public function validateStepTwo(Step2Request $request)
    {

        return back()->with('success', 'Step two completed');
    }

    public function store(Step3Request $request)
    {

        $this->students->create($request->all());

        return back()->with('success', 'CIDSA Information submitted.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Student $student)
    {
        //
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Student $student)
    {
        //
    }

    public function preview(Request $request)
    {

        $filters = $request->all();
        $students = $this->students->filter($filters);

        return Inertia::render('Export/Preview/Index', [
            'students' => $students,
        ]);

    }

    // public function export(Request $request)
    // {
    //     $students = $request->input('students');

    //     return Excel::download(
    //         new StudentsExport($students),
    //         'students.xlsx'
    //     );
    // }

    public function exportZip(Request $request)
    {
        $students = $request->input('students', []);

        $zipName = 'students_export.zip';
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
                if (!empty($student['picture']) && Storage::disk('public')->exists($student['picture'])) {
                    $zip->addEmptyDir('photos'); // create folder if not exists
                    $zip->addFile(
                        Storage::disk('public')->path($student['picture']),
                        'photos/' . basename($student['picture'])
                    );
                }

                // Add SIGNATURE if exists
                if (!empty($student['e_signature']) && Storage::disk('public')->exists($student['e_signature'])) {
                    $zip->addEmptyDir('signatures');
                    $zip->addFile(
                        Storage::disk('public')->path($student['e_signature']),
                        'signatures/' . basename($student['e_signature'])
                    );
                }

                // Add AFFIDAVIT if exists
                if (!empty($student['affidavit_img']) && Storage::disk('public')->exists($student['affidavit_img'])) {
                    $zip->addEmptyDir('affidavits');
                    $zip->addFile(
                        Storage::disk('public')->path($student['affidavit_img']),
                        'affidavits/' . basename($student['affidavit_img'])
                    );
                }

                // Add RECEIPT if exists
                if (!empty($student['receipt_img']) && Storage::disk('public')->exists($student['receipt_img'])) {
                    $zip->addEmptyDir('receipts');
                    $zip->addFile(
                        Storage::disk('public')->path($student['receipt_img']),
                        'receipts/' . basename($student['receipt_img'])
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
