<?php

namespace App\Http\Controllers;

use App\Enums\UserCampus;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct(protected User $model)
    {
    }
    public function index()
    {
        $users = $this->model->all();
        return Inertia::render('Users/Index', [
            'users' => $users,
            'campuses' => array_column(UserCampus::cases(), 'value'),
            'roles' => array_column(UserRole::cases(), 'value')
        ]);
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'campus' => ['required', Rule::enum(UserCampus::class)],
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'campus' => $validated['campus'],
            'role' => $validated['role'],
            'password' => ''
        ]);

        return back()->with('success', 'Account Created Successfully.');
    }

    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($id)],
            'campus' => ['required', Rule::enum(UserCampus::class)],
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        $user = $this->model->findOrFail($id);

        $user->update($validated);

        return back()->with('success', 'Account Updated Successfully.');
    }

}
