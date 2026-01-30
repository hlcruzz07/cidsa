<?php

namespace App\Http\Controllers;

use App\Exports\StudentsExport;
use App\Http\Requests\AddStudentRequest;
use App\Http\Requests\Step1Request;
use App\Http\Requests\Step2Request;
use App\Http\Requests\Step3Request;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Requests\ValidateStudentRequest;
use App\Jobs\ImportStudentsJob;
use App\Jobs\UpdateStudentsJob;
use App\Repositories\StudentRepository;
use Carbon\Carbon;
use Exception;
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

        $studentIdNumber = session('validated_student');
        $student = $this->students->findStudentByIdNumber($studentIdNumber);
        $campus = $student->campus;

        $data['picture'] = $request->hasFile('picture')
            ? $this->students->storeFile($request->file('picture'), $this->students->paths[$campus]['picture'])
            : null;

        $data['e_signature'] = $request->hasFile('e_signature')
            ? $this->students->storeFile($request->file('e_signature'), $this->students->paths[$campus]['e_signature'])
            : null;

        UpdateStudentsJob::dispatch($data, $student->id_number);

        session()->forget(['validated_student', 'validated_student_expires_at']);

        return Inertia::render('Student/Index', ['success' => true]);
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
            'students_file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('students_file');
        $now = Carbon::now();

        $handle = fopen($file->getRealPath(), 'r');

        // Read header safely
        $header = fgetcsv($handle);

        $students = [];
        $rowNumber = 1;

        $suffixes = ['JR', 'SR', 'II', 'III', 'IV', 'V'];

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;

            // Normalize row
            $row = array_map(fn($v) => is_string($v) ? trim($v) : $v, $row);

            // Required fields only (DO NOT rely on column count)
            $studentId = $row[0] ?? '';
            $firstName = $row[1] ?? '';
            $middleName = $row[2] ?? '';

            if ($studentId === '' || $firstName === '') {
                continue;
            }

            // Join remaining columns as LAST NAME
            $lastNameRaw = trim(implode(' ', array_slice($row, 3)));

            // Uppercase
            $firstName = mb_strtoupper($firstName, 'UTF-8');
            $middleName = mb_strtoupper($middleName, 'UTF-8');
            $lastNameRaw = mb_strtoupper($lastNameRaw, 'UTF-8');

            // Remove punctuation
            $firstName = preg_replace('/[,.]+/', ' ', $firstName);
            $middleName = preg_replace('/[,.]+/', ' ', $middleName);
            $lastNameRaw = preg_replace('/[,.]+/', ' ', $lastNameRaw);

            // Normalize spaces
            $firstName = preg_replace('/\s+/', ' ', trim($firstName));
            $middleName = preg_replace('/\s+/', ' ', trim($middleName));
            $lastNameRaw = preg_replace('/\s+/', ' ', trim($lastNameRaw));

            $suffix = null;

            /**
             * Detect suffix in FIRST NAME
             */
            $firstParts = explode(' ', $firstName);
            if (count($firstParts) > 1 && in_array(end($firstParts), $suffixes, true)) {
                $suffix = array_pop($firstParts);
                $firstName = implode(' ', $firstParts);
            }

            /**
             * Detect suffix in LAST NAME
             */
            $lastParts = explode(' ', $lastNameRaw);
            if (count($lastParts) > 1 && in_array(end($lastParts), $suffixes, true)) {
                $suffix = end($lastParts);
                array_pop($lastParts);
            }

            $lastName = trim(implode(' ', $lastParts));

            // Final validation
            if ($firstName === '' || $lastName === '') {
                continue;
            }

            $students[] = [
                'id_number' => $studentId,
                'first_name' => $firstName,
                'middle_init' => $middleName !== '' ? mb_substr($middleName, 0, 1) : null,
                'last_name' => $lastName,
                'suffix' => $suffix,
                'created_at' => $now,
                'updated_at' => null, // explicitly ignored
            ];
        }

        fclose($handle);

        return response()->json(
            $this->students->create($students)
        );
    }


    public function exportStudents(Request $request)
    {
        $students = $request->input('students', []);
        $fileName = $request->input('file_name', 'students');

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

        $this->students->addStudent($student);


        return redirect()->back()->with('success', 'Student ' . $student['id_number'] . ' added.');
    }

    public function edit(int $id)
    {
        $student = $this->students->find($id);

        return Inertia::render('Campus/Edit/Index', [
            'student' => $student
        ]);
    }

    public function view(int $id)
    {
        $student = $this->students->find($id);

        return Inertia::render('Campus/View/Index', [
            'student' => $student
        ]);
    }

    public function update(UpdateStudentRequest $request, $id)
    {
        $data = $request->except([
            'hasMajor',
        ]);

        $this->students->updateSingleStudent($data, $id);

        return back()->with('success', 'Student information updated');
    }

    public function updateIncompleteStudent(Request $request, $id)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:25',
            'middle_init' => 'nullable|alpha|size:1',
            'last_name' => 'required|string|max:25',
            'suffix' => 'nullable|string',
        ]);

        $this->students->updateIncompleteStudent($data, $id);

        return back()->with('success', 'Student basic information updated');
    }

    public function updateStudentPicture(Request $request, $id)
    {
        $data = $request->validate([
            'picture' => 'required|mimes:jpg|max:2048',
        ]);

        $this->students->updateStudentPicture($data, $id);

        return back()->with('success', 'Student picture updated');
    }

    public function exportSingleStudent($id)
    {
        $student = $this->students->find($id);

        $zipName = $student->id_number . '.zip';
        $zipPath = storage_path('app/' . $zipName);

        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {

            // 1️⃣ Generate Excel file temporarily
            $excelName = $student->id_number . '.xlsx';
            $excelTempPath = 'temp/' . $excelName;
            Storage::makeDirectory('temp');
            Excel::store(new StudentsExport([$student]), $excelTempPath);

            $zip->addFile(Storage::path($excelTempPath), $excelName);

            // 2️⃣ Loop through students
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
            $this->students->setExported($student->id);


            $zip->close();
        }



        // Cleanup temp Excel
        Storage::delete($excelTempPath);

        // Download ZIP
        return response()->download($zipPath)->deleteFileAfterSend(true);
    }

}
