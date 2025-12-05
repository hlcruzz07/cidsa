<?php

namespace App\Services;

use App\Repositories\StudentRepository;

class RegisterService
{
    public function __construct(
        protected StudentRepository $studentRepository
    ) {
    }

    public function getAllUsers()
    {
        return $this->studentRepository->all();
    }


    public function createUser(array $data)
    {
        // Example of business logic
        $data['full_name'] = $data['first_name'] . ' ' . $data['last_name'];

        return $this->studentRepository->create($data);
    }

    public function getUserById(int $id)
    {
        return $this->studentRepository->find($id);
    }
}
