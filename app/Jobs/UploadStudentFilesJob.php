<?php

namespace App\Jobs;

use App\Models\Student;
use App\Repositories\StudentRepository;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
class UploadStudentFilesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $studentId,
        public string $campus,
        public string $picturePath,
        public string $signaturePath,
    ) {
    }

    public function handle(StudentRepository $studentRepository): void
    {
        $student = Student::findOrFail($this->studentId);

        $uploadedPhoto = $studentRepository->storeFile(
            $this->picturePath,
            $this->campus,
            $studentRepository->paths[$this->campus]['picture']
        );

        $uploadedSignature = $studentRepository->storeFile(
            $this->signaturePath,
            $this->campus,
            $studentRepository->paths[$this->campus]['e_signature']
        );

        $student->update([
            'picture' => $uploadedPhoto['id'],
            'e_signature' => $uploadedSignature['id'],
            'is_complete' => true,
        ]);

        $student->save();
    }
}