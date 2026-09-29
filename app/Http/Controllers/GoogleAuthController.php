<?php

namespace App\Http\Controllers;

use App\Facades\ActivityLogger;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();

    }

    public function callback()
    {
        $googleUser = Socialite::driver('google')->user();

        $user = User::where('email', $googleUser->getEmail())->first();

        if (!$user) {
            return back()->with('error', 'Account Unauthorized');
        }
        ActivityLogger::login($user);

        Auth::login($user);

        return redirect()->route('dashboard')->with('success', "Welcome " . Auth::user()->name);
    }

}
