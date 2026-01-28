<?php

namespace App\Jobs;

use App\Repositories\StudentRepository;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class UpdateStudentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Retry config
     */
    public int $tries = 3;
    public int $timeout = 120;
    public bool $failOnTimeout = true;

    /**
     * Data passed to job
     */
    public array $data;
    public string $studentIdNumber;

    /**
     * Create a new job instance.
     */
    public function __construct(array $data, string $studentIdNumber)
    {
        $this->data = $data;
        $this->studentIdNumber = $studentIdNumber;
    }

    /**
     * Execute the job.
     */
    public function handle(StudentRepository $studentRepository): void
    {
        \Log::info('Starting student update job', [
            'student_id' => $this->studentIdNumber,
        ]);

        try {
            $result = $studentRepository->update(
                $this->data,
                $this->studentIdNumber

            );

            \Log::info('Student update job completed', [
                'student_id' => $result->id,
                'id_number' => $this->studentIdNumber,
            ]);

        } catch (\Throwable $e) {
            \Log::error('Failed to update student in job', [
                'student_id_number' => $this->studentIdNumber,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Handle job failure
     */
    public function failed(Throwable $exception): void
    {
        // Clean up session on failure
        session()->forget('validated_student');

        \Log::error('UpdateStudentsJob failed', [
            'student_id_number' => $this->studentIdNumber,
            'error' => $exception->getMessage(),
        ]);
    }
}