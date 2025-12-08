<?php

namespace App\Services;

use App\Repositories\StudentRepository;

class StudentService
{
    public function __construct(
        protected StudentRepository $studentRepository
    ) {}

    public function registerStudent(array $data)
    {
        return $this->studentRepository->all();
    }
}
