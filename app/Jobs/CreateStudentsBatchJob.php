<?php

namespace App\Jobs;

use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class CreateStudentsBatchJob implements ShouldQueue
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
    public array $studentsData;

    public function __construct(array $studentsData)
    {
        $this->studentsData = $studentsData;
    }

    /**
     * Execute the job
     */
    public function handle(): void
    {
        \Log::info('QUEUE JOB STARTED', [
            'total_count' => count($this->studentsData),
        ]);

        $chunks = array_chunk($this->studentsData, 100);

        foreach ($chunks as $index => $chunk) {
            Student::insertOrIgnore($chunk);

            \Log::info('Inserted chunk', [
                'chunk_index' => $index + 1,
                'chunk_size' => count($chunk),
            ]);
        }

        \Log::info('QUEUE JOB FINISHED', [
            'total_count' => count($this->studentsData),
        ]);
    }

    public function failed(Throwable $exception): void
    {
        \Log::error('STUDENT JOB FAILED PERMANENTLY', [
            'error' => $exception->getMessage(),
            'data' => $this->studentsData,
        ]);
    }
}
