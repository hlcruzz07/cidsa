<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Repositories\StudentRepository;
use App\Services\GoogleDriveService;
use Illuminate\Http\Request;

class StudentApiController extends Controller
{

    public function __construct(protected StudentRepository $studentRepository, protected GoogleDriveService $googleDriveService)
    {

    }

    public function filterPaginate(Request $request)
    {

        $filters = $request->all();



        return $this->studentRepository->filterPaginate($filters);
    }

    public function filterPaginateReplacement(Request $request)
    {


        $filters = $request->only([
            'search',
            'college',
            'program',
            'major',
            'year',
            'is_printed',
            'from',
            'to',
            'sort',
            'order',
            'perPage',
            'campus',
        ]);



        $data = $this->studentRepository->filterPaginateReplacement($filters);


        return $data;
    }


    public function studentsChart(Request $request)
    {

        $filters = $request->only([
            'campus',
            'timeRange',
        ]);



        return $this->studentRepository->studentsUpdateChart($filters['campus'], $filters['timeRange']);
    }

    public function dashboardChart(Request $request)
    {

        $filters = $request->only([
            'timeRange',
        ]);



        return $this->studentRepository->countStudentUpdatesPerCampus($filters['timeRange']);
    }


    public function getStudentById(string $id)
    {

        $student = $this->studentRepository->find($id);

        $student['picture'] = route('gdrive.image', [
            'fileId' => $student['picture']
        ]);

        $student['e_signature'] = route('gdrive.image', [
            'fileId' => $student['e_signature']
        ]);


        return $student;
    }

    public function getStudentByIds(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'max:100'],
            'ids.*' => ['string'],
        ]);

        return response()->json(
            $this->studentRepository->getStudentByIds($validated['ids'])
        );
    }

    public function image(string $fileId)
    {
        return $this->googleDriveService->getGDriveImage($fileId);
    }

    public function checkStatus(string $id_number, string $last_name)
    {
        $student = Student::where('id_number', $id_number)->where('last_name', $last_name)->with('printed')->first();

        if (!$student) {
            return response()->json([
                'status' => 'none',
            ]);
        }


        if ($student->printed()->exists()) {
            return response()->json([
                'status' => 'printed',
                'student' => $student,
            ]);
        }

        return response()->json([
            'status' => 'unprinted',
            'student' => $student,
        ]);
    }

}
