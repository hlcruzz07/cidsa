<?php

namespace App\Http\Controllers;

use App\Http\Requests\AddStudentRequest;
use App\Http\Requests\CheckIdStatusRequest;
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
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Database\QueryException;
use PDOException;


class StudentController extends Controller
{



    public function __construct(protected StudentRepository $repo, protected GoogleDriveService $googleDriveService)
    {

    }
    public function index()
    {
        session()->forget('student');

        return Inertia::render('Student/Index');
    }


    public function validate(ValidateStudentRequest $request)
    {
        try {
            $student = $this->repo->getStudentById(
                $request->id_number,
                $request->campus,
                $request->lname,
                $request->birthdate,
            );
        } catch (PDOException | QueryException $e) {
            report($e);

            return back()->with(
                'error',
                'Database connection failed. Please try again later.'
            );
        }

        if (!$student) {
            return back()->with('error', 'Student not found. Please check your student information.');
        }

        session([
            'student' => $student,
        ]);

        return redirect()->route('student.form');
    }


    public function create(CompleteStudentRequest $request)
    {
        try {
            $data = $request->except([
                'confirm_info',
                'data_privacy',
                'hasMajor',
            ]);

            if ($request->hasFile('picture')) {
                $uploaded = $this->repo->storeFile(
                    $request->file('picture'),
                    $data['campus'],
                    $this->repo->paths[$data['campus']]['picture']
                );
                $data['picture'] = $uploaded['id'];
            } else {
                unset($data['picture']);
            }

            if ($request->hasFile('e_signature')) {
                $uploaded = $this->repo->storeFile(
                    $request->file('e_signature'),
                    $data['campus'],
                    $this->repo->paths[$data['campus']]['e_signature']
                );
                $data['e_signature'] = $uploaded['id'];
            } else {
                unset($data['e_signature']);
            }

            $data['is_completed'] = true;
            $data['middle_init'] = !empty($data['middle_init']) ? $data['middle_init'] . '.' : null;
            $data['emergency_middle_init'] = !empty($data['emergency_middle_init']) ? $data['emergency_middle_init'] . '.' : null;

            DB::transaction(function () use ($request, $data) {

                $student = $this->repo->updateOrCreate($data, $data['id_number']);

                if ($request->type === 'replacement') {

                    $uploadedReceipt = $this->repo->storeFile(
                        $request->file('receipt'),
                        $data['campus'],
                        $this->repo->paths[$data['campus']]['receipt']
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

            session()->forget('student');

            return redirect()->route('home')->with([
                'id_request_success' => true,
                'id_number' => $data['id_number'],
            ]);

        } catch (\Throwable $e) {
            Log::error('Student submission failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return back()->with('error', 'Something went wrong, please try again.');
        }
    }

    public function cancel()
    {
        session()->forget('student');
        return redirect()->route('home');
    }

    public function studentForm()
    {
        if (!session()->has('student')) {
            return redirect()->route('home')->with('error', 'Session Expired');
        }

        $student = session('student');

        return Inertia::render('Student/Form/Index', [
            'student' => $student
        ]);
    }

    public function checkReplacement()
    {
        $student = $this->repo->find(session('student')['student_id']);

        return $student->replacements()->with('student')
            ->where('is_printed', true)
            ->latest()
            ->first() ?? null;
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


    public function update(UpdateStudentRequest $request, int $id)
    {
        $data = $request->except([
            'hasMajor',
        ]);

        $this->repo->updateSingleStudent($data, $id);

        return back()->with('success', 'Student information updated');
    }


    public function updateStatusNew(string $status, string $id_number)
    {

        switch ($status) {
            case 'pending':
                $this->repo->setPendingForNew($id_number);

                return back()->with('success', 'Student status updated to ' . $status . ' successfully!');
            case 'printed':
                $this->repo->setPrintedForNew($id_number);
                return back()->with('success', 'Student status updated to ' . $status . ' successfully!');
            default:
                return back()->with('error', 'Invalid status.');
        }
    }

    public function updateStatusRep(string $status, int $id)
    {

        switch ($status) {
            case 'pending':
                $this->repo->setPendingForReplacement($id);

                return back()->with('success', 'Student status updated to ' . $status . ' successfully!');
            case 'printed':
                $this->repo->setPrintedForReplacement($id);
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
