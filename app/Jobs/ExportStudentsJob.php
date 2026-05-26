<?php

namespace App\Jobs;

use App\Exports\StudentsExport;
use App\Models\Student;
use App\Models\StudentExport;
use App\Services\GoogleDriveService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use ZipArchive;

class ExportStudentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 0;
    public $tries = 1;

    protected array $studentIds;
    protected int $exportId;
    protected string $fileName;

    public function __construct(array $studentIds, int $exportId, string $fileName)
    {
        $this->studentIds = $studentIds;
        $this->exportId = $exportId;
        $this->fileName = $fileName;
    }

    public function handle(GoogleDriveService $googleDriveService): void
    {
        $export = StudentExport::findOrFail($this->exportId);

        $export->update([
            'status' => 'processing'
        ]);

        $excelStoragePath = null;
        $zipPath = null;

        try {

            /*
            |--------------------------------------------------------------------------
            | Students
            |--------------------------------------------------------------------------
            */
            $students = Student::whereIn('id', $this->studentIds)->get();

            if ($students->isEmpty()) {
                throw new \Exception('No students found.');
            }

            /*
            |--------------------------------------------------------------------------
            | Safe filename
            |--------------------------------------------------------------------------
            */
            $safeFileName = preg_replace(
                '/[^A-Za-z0-9_\-]/',
                '_',
                $this->fileName
            );

            /*
            |--------------------------------------------------------------------------
            | Ensure directories
            |--------------------------------------------------------------------------
            */
            Storage::makeDirectory('exports');
            Storage::makeDirectory('temp');

            $zipName = $safeFileName . '_' . time() . '.zip';

            $zipPath = storage_path('app/exports/' . $zipName);

            $zipStoragePath = 'exports/' . $zipName;

            Log::info("ZIP PATH: " . $zipPath);

            /*
            |--------------------------------------------------------------------------
            | Create ZIP (SAFE CHECK)
            |--------------------------------------------------------------------------
            */
            $zip = new ZipArchive();

            $openResult = $zip->open(
                $zipPath,
                ZipArchive::CREATE | ZipArchive::OVERWRITE
            );

            if ($openResult !== true) {
                throw new \Exception("Cannot create ZIP. Code: {$openResult}");
            }

            /*
            |--------------------------------------------------------------------------
            | Excel Export
            |--------------------------------------------------------------------------
            */
            $excelStoragePath = 'temp/' . uniqid() . '_students.xlsx';

            Excel::store(
                new StudentsExport($students),
                $excelStoragePath,
                'local'
            );

            $excelFullPath = Storage::path($excelStoragePath);

            if (!file_exists($excelFullPath)) {
                throw new \Exception('Excel file not generated.');
            }

            $zip->addFile($excelFullPath, 'students.xlsx');

            /*
            |--------------------------------------------------------------------------
            | Attach files
            |--------------------------------------------------------------------------
            */
            foreach ($students as $student) {

                /*
                |---------------- PHOTO ----------------|
                */
                if (!empty($student->picture)) {

                    try {
                        $photoContent = null;

                        if (preg_match('/^[a-zA-Z0-9_-]{25,}$/', $student->picture)) {
                            $photoContent = $googleDriveService->getFileContent($student->picture);
                        } else {
                            if (Storage::disk('public')->exists($student->picture)) {
                                $photoContent = Storage::disk('public')->get($student->picture);
                            }
                        }

                        if ($photoContent) {
                            $zip->addFromString(
                                "photos/{$student->id_number}.jpg",
                                $photoContent
                            );
                        }

                    } catch (\Exception $e) {
                        Log::warning("Photo error: " . $e->getMessage());
                    }
                }

                /*
                |---------------- SIGNATURE ----------------|
                */
                if (!empty($student->e_signature)) {

                    try {
                        $signatureContent = null;

                        if (preg_match('/^[a-zA-Z0-9_-]{25,}$/', $student->e_signature)) {
                            $signatureContent = $googleDriveService->getFileContent($student->e_signature);
                        } else {
                            if (Storage::disk('public')->exists($student->e_signature)) {
                                $signatureContent = Storage::disk('public')->get($student->e_signature);
                            }
                        }

                        if ($signatureContent) {
                            $zip->addFromString(
                                "signatures/{$student->id_number}.bmp",
                                $signatureContent
                            );
                        }

                    } catch (\Exception $e) {
                        Log::warning("Signature error: " . $e->getMessage());
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Close ZIP
            |--------------------------------------------------------------------------
            */
            $zip->close();

            if (!file_exists($zipPath)) {
                throw new \Exception('ZIP was not created.');
            }

            /*
            |--------------------------------------------------------------------------
            | Mark exported (FAST BATCH UPDATE)
            |--------------------------------------------------------------------------
            */
            DB::transaction(function () {
                Student::whereIn('id', $this->studentIds)
                    ->update(['is_exported' => true]);
            });

            /*
            |--------------------------------------------------------------------------
            | Cleanup
            |--------------------------------------------------------------------------
            */
            if ($excelStoragePath && Storage::exists($excelStoragePath)) {
                Storage::delete($excelStoragePath);
            }

            /*
            |--------------------------------------------------------------------------
            | Success
            |--------------------------------------------------------------------------
            */
            $export->update([
                'status' => 'completed',
                'file_path' => $zipStoragePath,
                'completed_at' => now(),
                'error_message' => null,
            ]);

            Log::info("Export completed: " . $zipStoragePath);

        } catch (\Exception $e) {

            Log::error("EXPORT FAILED: " . $e->getMessage());

            $export->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }
    }
}