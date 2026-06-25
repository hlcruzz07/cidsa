<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

        $filters = $request->only([
            'search',
            'type',
            'college',
            'program',
            'major',
            'year',
            'from',
            'to',
            'sort',
            'order',
            'perPage',
            'campus',
        ]);



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



        return $this->studentRepository->filterPaginateReplacement($filters);
    }

    public function filterPaginateAll(Request $request)
    {

        $filters = $request->only([
            'search',
            'from',
            'to',
            'sort',
            'order',
            'perPage',

        ]);



        return $this->studentRepository->filterPaginateAll($filters);
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


    public function getStudentById(int $id)
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
        $ids = $request->input('ids');
        return $this->studentRepository->getStudetsByIds($ids)
            ->transform(function ($student) {
                foreach (['picture', 'e_signature'] as $field) {
                    $student->{$field} = filled($student->{$field})
                        ? route('gdrive.image', ['fileId' => $student->{$field}])
                        : null;
                }

                return $student;
            });
    }
    public function image(string $fileId)
    {
        return $this->googleDriveService->getGDriveImage($fileId);
    }
}
