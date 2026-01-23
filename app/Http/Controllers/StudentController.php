<?php

namespace App\Http\Controllers;

use App\Exports\StudentsExport;
use App\Http\Requests\AddStudentRequest;
use App\Http\Requests\Step1Request;
use App\Http\Requests\Step2Request;
use App\Http\Requests\Step3Request;
use App\Http\Requests\ValidateStudentRequest;
use App\Repositories\StudentRepository;
use Carbon\Carbon;
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
        session()->forget('success');
        return Inertia::render('Student/Index');
    }

    public function validate(ValidateStudentRequest $request)
    {
        return redirect()->route('student.form');
    }

    public function validateStepOne(Step1Request $request)
    {
        return back()->with('success', 'Step one completed');
    }

    public function validateStepTwo(Step2Request $request)
    {

        return back()->with('success', 'Step two completed');
    }

    public function updateStudent(Step3Request $request)
    {

        $data = $request->except([
            'confirm_info',
            'data_privacy',
            'hasMajor',
        ]);

        $data['emergency_middle_init'] = $request->emergency_middle_init ? $request->emergency_middle_init . '.' : null;
        $data['emergency_suffix'] = $request->emergency_suffix ? $request->emergency_suffix . '.' : null;

        $this->students->update($data);

        session()->forget([
            'validated_student',
            'validated_student_expires_at',
        ]);

        return Inertia::render('Student/Index', [
            'success' => true,
        ]);
    }

    public function cancel()
    {
        session()->forget([
            'validated_student',
            'validated_student_expires_at',
        ]);

        return redirect()->route('home');
    }

    public function studentForm()
    {
        $student = $this->students->findStudentByIdNumber(session('validated_student'));
        return Inertia::render('Student/Form/Index', [
            'student' => $student
        ]);
    }


    public function importStudents(Request $request)
    {
        $request->validate([
            'students_file' => 'required|file|mimes:csv',
            'campus' => 'required'
        ]);

        $file = $request->file('students_file');
        $campus = $request->input('campus');
        $now = Carbon::now();

        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);

        $students = [];

        $suffixes = ['JR', 'SR', 'II', 'III', 'IV', 'V'];

        while (($row = fgetcsv($handle)) !== false) {

            if (count($row) < 3) {
                continue;
            }


            $studentId = trim($row[0]);
            $firstName = trim($row[1] ?? '');
            $middleName = trim($row[2] ?? '');
            $lastNameRaw = trim(implode(',', array_slice($row, 3)));

            if ($studentId === '' || $firstName === '') {
                continue;
            }

            $firstName = mb_strtoupper($firstName, 'UTF-8');
            $middleName = mb_strtoupper($middleName, 'UTF-8');
            $lastNameRaw = mb_strtoupper($lastNameRaw, 'UTF-8');

            $suffix = null;

            $firstParts = preg_split('/\s+/', $firstName);
            $firstLastWord = rtrim(end($firstParts), '.');

            if (in_array($firstLastWord, $suffixes, true)) {
                $suffix = $firstLastWord . '.';
                array_pop($firstParts);
                $firstName = trim(implode(' ', $firstParts));
            }

            $normalizedLast = preg_replace('/,\s*/', ' ', $lastNameRaw);

            $lastParts = preg_split('/\s+/', $normalizedLast);
            $lastWord = rtrim(end($lastParts), '.');

            if (in_array($lastWord, $suffixes, true)) {
                $suffix = $lastWord . '.';
                array_pop($lastParts);
            }

            $lastName = trim(implode(' ', $lastParts));

            $middleInitial = null;
            if ($middleName !== '') {
                $middleInitial = mb_substr($middleName, 0, 1) . '.';
            }


            if ($firstName === '' || $lastName === '') {
                continue;
            }


            $students[] = [
                'id_number' => $studentId,
                'first_name' => $firstName,
                'middle_init' => $middleInitial,
                'last_name' => $lastName,
                'suffix' => $suffix ?? null,
                'campus' => $campus,
                'created_at' => $now,
                'updated_at' => null,
            ];
        }

        fclose($handle);

        $result = $this->students->create($students);

        return back()->with('success', 'Students inserted: ' . $result['inserted']);
    }


    public function exportStudents(Request $request)
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

                // // Add AFFIDAVIT if exists
                // if (!empty($student['affidavit_img']) && Storage::disk('public')->exists($student['affidavit_img'])) {
                //     $zip->addEmptyDir('affidavits');
                //     $zip->addFile(
                //         Storage::disk('public')->path($student['affidavit_img']),
                //         'affidavits/' . basename($student['affidavit_img'])
                //     );
                // }

                // // Add RECEIPT if exists
                // if (!empty($student['receipt_img']) && Storage::disk('public')->exists($student['receipt_img'])) {
                //     $zip->addEmptyDir('receipts');
                //     $zip->addFile(
                //         Storage::disk('public')->path($student['receipt_img']),
                //         'receipts/' . basename($student['receipt_img'])
                //     );
                // }
                $this->students->setExported($student['id']);
            }



            $zip->close();
        }



        // Cleanup temp Excel
        Storage::delete($excelTempPath);

        // Download ZIP
        return response()->download($zipPath)->deleteFileAfterSend(true);
    }

    public function addStudent(AddStudentRequest $request)
    {
        $student = $request->validated();

        $student['middle_init'] = $request->middle_init ? $request->middle_init . '.' : null;
        $student['suffix'] = $request->suffix ? $request->suffix . '.' : null;

        $this->students->addStudent($student);


        return redirect()->back()->with('success', 'Student ' . $student['id_number'] . ' added successfully.');
    }

}
