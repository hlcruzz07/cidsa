<?php

namespace App\Jobs;

use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ImportStudentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Retry config
     */
    public int $tries = 3;
    public int $timeout = 300;
    public bool $failOnTimeout = true;

    /**
     * Data passed to job
     */
    public string $filePath;
    public string $originalFileName;
    public string $campus;
    public ?int $userId;

    public function __construct(string $filePath, string $originalFileName, string $campus, ?int $userId = null)
    {
        $this->filePath = $filePath;
        $this->originalFileName = $originalFileName;
        $this->campus = $campus;
        $this->userId = $userId;
    }

    /**
     * Execute the job
     */
    public function handle(): void
    {
        \Log::info('STUDENT IMPORT JOB STARTED', [
            'campus' => $this->campus,
            'file_name' => $this->originalFileName,
            'file_path' => $this->filePath,
            'user_id' => $this->userId,
        ]);

        if (!Storage::exists($this->filePath)) {
            \Log::error('CSV file not found at path', ['path' => $this->filePath]);
            throw new \Exception("CSV file not found at path: {$this->filePath}");
        }

        $studentsData = $this->parseCsvFile();

        if (empty($studentsData)) {
            \Log::warning('No valid student data found in CSV file');

            // Clean up the temporary file
            $this->cleanupFile();
            return;
        }

        \Log::info('CSV parsing completed', [
            'valid_records' => count($studentsData),
        ]);

        $this->insertStudentsInBatches($studentsData);

        // Clean up the temporary file after successful processing
        $this->cleanupFile();

        \Log::info('STUDENT IMPORT JOB FINISHED', [
            'total_inserted' => count($studentsData),
            'campus' => $this->campus,
        ]);
    }

    /**
     * Parse CSV file and extract student data
     */
    private function parseCsvFile(): array
    {
        $fullPath = Storage::path($this->filePath);
        $handle = fopen($fullPath, 'r');

        if (!$handle) {
            \Log::error('Failed to open CSV file', ['path' => $fullPath]);
            throw new \Exception('Failed to open CSV file at: ' . $fullPath);
        }

        // Read header row (skip it)
        $header = fgetcsv($handle);
        \Log::debug('CSV header', ['header' => $header]);

        $students = [];
        $suffixes = ['JR', 'SR', 'II', 'III', 'IV', 'V'];
        $now = Carbon::now();
        $rowNumber = 1; // Start from 1 since we already read the header

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;
            try {
                $studentData = $this->processRow($row, $suffixes, $now, $rowNumber);
                if ($studentData) {
                    $students[] = $studentData;
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to process CSV row', [
                    'row_number' => $rowNumber,
                    'row' => $row,
                    'error' => $e->getMessage(),
                ]);
                continue;
            }
        }

        fclose($handle);
        return $students;
    }

    /**
     * Process individual CSV row
     */
    private function processRow(array $row, array $suffixes, Carbon $now, int $rowNumber): ?array
    {
        // Skip rows with insufficient data
        if (count($row) < 3) {
            \Log::debug('Skipping row with insufficient columns', [
                'row_number' => $rowNumber,
                'column_count' => count($row),
            ]);
            return null;
        }

        $studentId = trim($row[0]);
        $firstName = trim($row[1] ?? '');
        $middleName = trim($row[2] ?? '');
        $lastNameRaw = trim(implode(',', array_slice($row, 3)));

        // Skip rows with missing essential data
        if ($studentId === '' || $firstName === '') {
            \Log::debug('Skipping row with missing essential data', [
                'row_number' => $rowNumber,
                'student_id' => $studentId,
                'first_name' => $firstName,
            ]);
            return null;
        }

        // Convert to uppercase
        $firstName = mb_strtoupper($firstName, 'UTF-8');
        $middleName = mb_strtoupper($middleName, 'UTF-8');
        $lastNameRaw = mb_strtoupper($lastNameRaw, 'UTF-8');

        // Process suffix extraction from first name
        $suffix = null;
        $firstParts = preg_split('/\s+/', $firstName);
        $firstLastWord = rtrim(end($firstParts), '.');

        if (in_array($firstLastWord, $suffixes, true)) {
            $suffix = $firstLastWord;
            array_pop($firstParts);
            $firstName = trim(implode(' ', $firstParts));
        }

        // Process suffix extraction from last name
        $normalizedLast = preg_replace('/,\s*/', ' ', $lastNameRaw);
        $lastParts = preg_split('/\s+/', $normalizedLast);
        $lastWord = rtrim(end($lastParts), '.');

        if (in_array($lastWord, $suffixes, true)) {
            $suffix = $lastWord;
            array_pop($lastParts);
        }

        $lastName = trim(implode(' ', $lastParts));

        // Skip if essential names are still empty after processing
        if ($firstName === '' || $lastName === '') {
            \Log::debug('Skipping row with empty names after processing', [
                'row_number' => $rowNumber,
                'first_name' => $firstName,
                'last_name' => $lastName,
            ]);
            return null;
        }

        // Extract middle initial
        $middleInitial = null;
        if ($middleName !== '') {
            $middleInitial = mb_substr($middleName, 0, 1);
        }

        \Log::debug('Processed row successfully', [
            'row_number' => $rowNumber,
            'student_id' => $studentId,
            'first_name' => $firstName,
            'last_name' => $lastName,
        ]);

        return [
            'id_number' => $studentId,
            'first_name' => $firstName,
            'middle_init' => $middleInitial,
            'last_name' => $lastName,
            'suffix' => $suffix,
            'campus' => $this->campus,
            'created_at' => $now,
            'updated_at' => null,
        ];
    }

    /**
     * Insert students in batches with duplicate handling
     */
    private function insertStudentsInBatches(array $studentsData): void
    {
        $chunks = array_chunk($studentsData, 100);

        foreach ($chunks as $index => $chunk) {
            try {
                // Insert chunk while ignoring duplicates
                Student::insertOrIgnore($chunk);

                \Log::debug('Inserted student chunk', [
                    'chunk_index' => $index + 1,
                    'chunk_size' => count($chunk),
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to insert student chunk', [
                    'chunk_index' => $index + 1,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                throw $e;
            }
        }

        \Log::info('All student chunks inserted successfully', [
            'total_chunks' => count($chunks),
            'total_records' => count($studentsData),
        ]);
    }

    /**
     * Clean up the temporary file
     */
    private function cleanupFile(): void
    {
        try {
            if (Storage::exists($this->filePath)) {
                Storage::delete($this->filePath);
                \Log::debug('Temporary file cleaned up', ['path' => $this->filePath]);
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to cleanup temporary file', [
                'path' => $this->filePath,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function failed(Throwable $exception): void
    {
        \Log::error('STUDENT IMPORT JOB FAILED PERMANENTLY', [
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
            'campus' => $this->campus,
            'file_name' => $this->originalFileName,
            'file_path' => $this->filePath,
            'user_id' => $this->userId,
        ]);

        // Attempt to cleanup file on failure
        $this->cleanupFile();
    }
}