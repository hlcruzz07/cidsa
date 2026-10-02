<?php

namespace App\Http\Controllers;

use App\Enums\PrintingType;
use App\Facades\ActivityLogger;
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
use SebastianBergmann\Type\VoidType;

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
                $isReplacement = $request->type === 'replacement';

                $student = $this->repo->updateOrCreate(
                    $data,
                    $data['id_number'],
                    disableTimestamps: $isReplacement
                );

                if ($isReplacement) {
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


}
