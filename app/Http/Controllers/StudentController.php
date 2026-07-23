<?php

namespace App\Http\Controllers;

use App\Http\Requests\AddStudentRequest;
use App\Http\Requests\CompleteStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Requests\ValidateStudentRequest;
use App\Models\PrintedStudents;
use App\Models\Student;
use App\Models\StudentReplacement;
use App\Repositories\StudentRepository;
use App\Services\GoogleDriveService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Database\QueryException;
use PDOException;


class StudentController extends Controller
{

    protected $students;

    protected $googleDriveService;

    public function __construct(StudentRepository $studentRepository, GoogleDriveService $googleDriveService)
    {
        $this->students = $studentRepository;
        $this->googleDriveService = $googleDriveService;
    }
    public function index()
    {
        session()->forget('validated_student');

        return Inertia::render('Student/Index');
    }


    public function validate(ValidateStudentRequest $request)
    {
        try {
            $student = $this->students->getStudentById(
                $request->id_number,
                $request->campus
            );
        } catch (PDOException | QueryException $e) {
            report($e);

            return back()->with(
                'error',
                'Unable to connect to the campus database. Please try again later.'
            );
        }

        if (!$student) {
            return back()->with('error', 'Student not found.');
        }

        $storeStudent = Student::updateOrCreate([
            'id_number' => $student['student_id'],
        ], [
            'first_name' => $student['student_firstname'],
            'middle_init' => $student['student_middlename'] !== '' ? mb_substr($student['student_middlename'], 0, 1) : null,
            'last_name' => $student['student_lastname'],
            'suffix' => $student['suffix'],
            'created_at' => now(),
            'updated_at' => null
        ]);

        session([
            'validated_student' => $storeStudent->id_number,
        ]);

        return redirect()->route('student.form');
    }


    public function updateStudent(CompleteStudentRequest $request)
    {
        try {
            $data = $request->except([
                'confirm_info',
                'data_privacy',
                'hasMajor',
            ]);

            $studentIdNumber = session('validated_student');
            $student = $this->students->findStudentByIdNumber($studentIdNumber);

            if ($request->hasFile('picture')) {
                $uploaded = $this->students->storeFile(
                    $request->file('picture'),
                    $data['campus'],
                    $this->students->paths[$data['campus']]['picture']
                );
                $data['picture'] = $uploaded['id'];
            }


            if ($request->hasFile('e_signature')) {
                $uploaded = $this->students->storeFile(
                    $request->file('e_signature'),
                    $data['campus'],
                    $this->students->paths[$data['campus']]['e_signature']
                );
                $data['e_signature'] = $uploaded['id'];
            }

            $data['is_completed'] = true;
            DB::transaction(function () use ($request, &$student, $data) {

                $student = $this->students->update($data, $student->id_number);

                if ($request->type === 'replacement') {

                    $uploadedReceipt = $this->students->storeFile(
                        $request->file('receipt'),
                        $data['campus'],
                        $this->students->paths[$data['campus']]['receipt']
                    );

                    StudentReplacement::create([
                        'student_id' => $student->id,
                        'reason' => $request->reason,
                        'receipt' => $uploadedReceipt['id'],
                        'is_printed' => false,
                    ]);

                    PrintedStudents::firstOrCreate([
                        'id_number' => $student->id_number,
                    ]);
                }
            });

            session()->forget('validated_student');

            return Inertia::render('Student/Index', ['success' => true]);

        } catch (Exception $e) {
            return back()->with('error', 'Something went wrong, please try again' . $e->getMessage());
        }
    }

    public function cancel()
    {
        session()->forget('validated_student');
        return redirect()->route('home');
    }

    public function studentForm()
    {
        if (!session()->has('validated_student')) {
            return redirect()->route('home')->with('error', 'Session Expired');
        }

        $student = $this->students->findStudentByIdNumber(
            session('validated_student')
        );

        return Inertia::render('Student/Form/Index', [
            'student' => $student
        ]);
    }

    public function checkReplacement()
    {
        $student = $this->students->findStudentByIdNumber(
            session('validated_student')
        );

        return $student->replacements()->with('student')
            ->where('is_printed', true)
            ->latest()
            ->first() ?? null;
    }


    public function importStudents(Request $request)
    {
        $request->validate([
            'students_file' => 'required|file|mimes:csv',
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

    public function importPrintedStudents(Request $request)
    {
        $request->validate([
            'students_file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('students_file');
        $now = Carbon::now();

        $handle = fopen($file->getRealPath(), 'r');

        $header = fgetcsv($handle);

        $students = [];

        while (($row = fgetcsv($handle)) !== false) {

            // Expect only 1 column: id_number
            $idNumber = trim($row[0] ?? '');

            if ($idNumber === '') {
                continue;
            }

            $students[] = [
                'id_number' => $idNumber,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        fclose($handle);

        if (empty($students)) {
            return redirect()->back()->with('error', 'No valid student records found.');
        }

        // Insert using PrintedStudent model
        PrintedStudents::upsert(
            $students,
            ['id_number'],
            ['updated_at']
        );

        return redirect()->back()->with('success', 'Students imported successfully: ' . count($students));
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

        $student['picture'] = $student['picture'] ? route('gdrive.image', [
            'fileId' => $student['picture']
        ]) : null;

        $student['e_signature'] = $student['e_signature'] ? route('gdrive.image', [
            'fileId' => $student['e_signature']
        ]) : null;


        return Inertia::render('Campus/Edit/Index', [
            'student' => $student
        ]);
    }
    public function view(int $id)
    {
        $student = $this->students->find($id);

        $student['picture'] = $student['picture'] ? route('gdrive.image', [
            'fileId' => $student['picture']
        ]) : null;

        $student['e_signature'] = $student['e_signature'] ? route('gdrive.image', [
            'fileId' => $student['e_signature']
        ]) : null;

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

    public function updateStatusNew(string $status, string $id_number)
    {

        switch ($status) {
            case 'pending':
                $this->students->setPendingForNew($id_number);

                return back()->with('success', 'Student status updated to ' . $status . ' successfully!');
            case 'printed':
                $this->students->setPrintedForNew($id_number);
                return back()->with('success', 'Student status updated to ' . $status . ' successfully!');
            default:
                return back()->with('error', 'Invalid status.');
        }
    }

    public function updateStatusRep(string $status, int $id)
    {

        switch ($status) {
            case 'pending':
                $this->students->setPendingForReplacement($id);

                return back()->with('success', 'Student status updated to ' . $status . ' successfully!');
            case 'printed':
                $this->students->setPrintedForReplacement($id);
                return back()->with('success', 'Student status updated to ' . $status . ' successfully!');
            default:
                return back()->with('error', 'Invalid status.');
        }
    }

    public function storeChecklist(Request $request, GoogleDriveService $googleDriveService)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx',
            'campus' => 'required|string',
        ]);

        $result = $googleDriveService->uploadChecklist(
            $request->file('file'),
            $request->input('campus'),
        );

        return response()->json($result);
    }
}
