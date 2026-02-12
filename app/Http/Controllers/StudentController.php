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
use App\Repositories\ExportRepository;
use App\Repositories\StudentRepository;
use App\Services\GoogleDriveService;
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
    protected $export;

    protected $googleDriveService;

    public function __construct(StudentRepository $studentRepository, ExportRepository $exportRepository, GoogleDriveService $googleDriveService)
    {
        $this->students = $studentRepository;
        $this->export = $exportRepository;
        $this->googleDriveService = $googleDriveService;
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
        try {
            $data = $request->except([
                'confirm_info',
                'data_privacy',
                'hasMajor',
            ]);

            $studentIdNumber = session('validated_student');
            $student = $this->students->findStudentByIdNumber($studentIdNumber);

            // Upload picture to Google Drive and store file ID
            if ($request->hasFile('picture')) {
                $uploaded = $this->students->storeFile(
                    $request->file('picture'),
                    $data['campus'],
                    $this->students->paths[$data['campus']]['picture']
                );
                $data['picture'] = $uploaded['id']; // Store Drive ID in picture column
            }

            // Upload signature to Google Drive and store file ID
            if ($request->hasFile('e_signature')) {
                $uploaded = $this->students->storeFile(
                    $request->file('e_signature'),
                    $data['campus'],
                    $this->students->paths[$data['campus']]['e_signature']
                );
                $data['e_signature'] = $uploaded['id']; // Store Drive ID in e_signature column
            }

            UpdateStudentsJob::dispatch($data, $student->id_number);

            session()->forget(['validated_student', 'validated_student_expires_at']);

            return Inertia::render('Student/Index', ['success' => true]);
        } catch (Exception $e) {
            return back()->with('error', 'Something went wrong, please try again' . $e->getMessage());
        }
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

        $result = $this->students->create($students);

        return redirect()->back()->with('success', "Students imported: " . $result['to_insert']);
    }


    public function exportStudents(Request $request)
    {
        $students = $request->input('students', []);
        $fileName = $request->input('file_name', 'students');

        $zipName = $fileName . '.zip';
        $zipPath = storage_path('app/' . $zipName);

        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return response()->json(['error' => 'Could not create ZIP file.'], 500);
        }

        // 1️⃣ Generate Excel file temporarily
        $excelName = 'students.xlsx';
        $excelStoragePath = 'temp/' . $excelName; // relative to storage/app

        if (!Storage::exists('temp')) {
            Storage::makeDirectory('temp');
        }

        Excel::store(new StudentsExport($students), $excelStoragePath, 'local');
        $zip->addFile(Storage::path($excelStoragePath), $excelName);

        $user_id = $request->user()->id;
        $export_id = $this->export->addExportHistory($user_id, $fileName);

        // 2️⃣ Loop through students
        foreach ($students as $student) {

            // Add PHOTO
            if (!empty($student['picture'])) {
                try {
                    if (preg_match('/^[a-zA-Z0-9_-]{25,}$/', $student['picture'])) {
                        // Google Drive ID
                        $photoContent = $this->googleDriveService->getFileContent($student['picture']);
                    } else {
                        // Local storage path
                        if (Storage::disk('public')->exists($student['picture'])) {
                            $photoContent = Storage::disk('public')->get($student['picture']);
                        } else {
                            continue;
                        }
                    }

                    if (!empty($photoContent)) {
                        $photoName = $student['id_number'] . '.jpg'; // 👈 renamed here
                        $zip->addFromString('photos/' . $photoName, $photoContent);
                    }
                } catch (\Exception $e) {
                    \Log::warning("Failed to fetch photo for student {$student['id']}: " . $e->getMessage());
                }
            }

            // Add SIGNATURE
            if (!empty($student['e_signature'])) {
                try {
                    if (preg_match('/^[a-zA-Z0-9_-]{25,}$/', $student['e_signature'])) {
                        // Google Drive ID
                        $signatureContent = $this->googleDriveService->getFileContent($student['e_signature']);
                    } else {
                        // Local storage path
                        if (Storage::disk('public')->exists($student['e_signature'])) {
                            $signatureContent = Storage::disk('public')->get($student['e_signature']);
                        } else {
                            continue;
                        }
                    }

                    if (!empty($signatureContent)) {
                        $signatureName = $student['id_number'] . '.bmp'; // 👈 renamed here
                        $zip->addFromString('signatures/' . $signatureName, $signatureContent);
                    }
                } catch (\Exception $e) {
                    \Log::warning("Failed to fetch signature for student {$student['id']}: " . $e->getMessage());
                }
            }


            // Mark student as exported
            $this->students->setExported($student['id']);
            $this->export->addExportedStudent($export_id, $student['id']);
        }

        $zip->close();

        // Cleanup temp Excel
        if (Storage::exists($excelStoragePath)) {
            Storage::delete($excelStoragePath);
        }

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

        $student['picture'] = ($student['picture'] !== null) ? "data:image/jpg;base64," . base64_encode($this->googleDriveService->getFileContent($student->picture)) : null;
        $student['e_signature'] = ($student['e_signature'] !== null) ? "data:image/jpg;base64," . base64_encode($this->googleDriveService->getFileContent($student->e_signature)) : null;


        return Inertia::render('Campus/Edit/Index', [
            'student' => $student
        ]);
    }
    public function view(int $id)
    {
        $student = $this->students->find($id);

        $student['picture'] = ($student['picture'] !== null) ? "data:image/jpg;base64," . base64_encode($this->googleDriveService->getFileContent($student->picture)) : null;

        $student['e_signature'] = ($student['e_signature'] !== null) ? "data:image/jpg;base64," . base64_encode($this->googleDriveService->getFileContent($student->e_signature)) : null;

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

    // public function updateStudentPicture(Request $request, $id)
    // {
    //     $data = $request->validate([
    //         'picture' => 'required|mimes:jpg|max:2048',
    //     ]);

    //     $this->students->updateStudentPicture($data, $id);

    //     return back()->with('success', 'Student picture updated');
    // }
    public function exportSingleStudent($id)
    {
        $student = $this->students->find($id);

        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
        }

        $zipName = $student->id_number . '.zip';
        $zipPath = storage_path('app/' . $zipName);

        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return response()->json(['error' => 'Could not create ZIP file'], 500);
        }

        // ========================
        // 1️⃣ Generate Excel in memory
        // ========================
        try {
            $excelContent = Excel::raw(new StudentsExport([$student]), \Maatwebsite\Excel\Excel::XLSX);
            $excelName = $student->id_number . '.xlsx';
            $zip->addFromString($excelName, $excelContent);
        } catch (\Exception $e) {
            $zip->close();
            return response()->json(['error' => 'Failed to generate Excel file: ' . $e->getMessage()], 500);
        }

        // ========================
        // 2️⃣ Add PHOTO
        // ========================
        if (!empty($student->picture)) {
            try {
                $photoContent = null;

                if (preg_match('/^[a-zA-Z0-9_-]{25,}$/', $student->picture)) {
                    // Google Drive ID
                    $photoContent = $this->googleDriveService->getFileContent($student->picture);
                } else {
                    // Local storage
                    if (Storage::disk('public')->exists($student->picture)) {
                        $photoContent = Storage::disk('public')->get($student->picture);
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

        // ========================
        // 3️⃣ Add SIGNATURE
        // ========================
        if (!empty($student->e_signature)) {
            try {
                $signatureContent = null;

                if (preg_match('/^[a-zA-Z0-9_-]{25,}$/', $student->e_signature)) {
                    // Google Drive ID
                    $signatureContent = $this->googleDriveService->getFileContent($student->e_signature);
                } else {
                    // Local storage
                    if (Storage::disk('public')->exists($student->e_signature)) {
                        $signatureContent = Storage::disk('public')->get($student->e_signature);
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

        // ========================
        // Mark student as exported
        // ========================
        $this->students->setExported($student->id);

        $zip->close();

        // ========================
        // Return ZIP as download
        // ========================
        return response()->download($zipPath)->deleteFileAfterSend(true);
    }

}
