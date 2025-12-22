<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class CampusRouteController extends Controller
{
    public function index()
    {
        return redirect()->route('campus.talisay');
    }

    public function talisay()
    {
        return Inertia::render('Campus/Talisay/Index');
    }

    public function alijis()
    {
        return Inertia::render('Campus/Alijis/Index');
    }

    public function binalbagan()
    {
        return Inertia::render('Campus/Binalbagan/Index');
    }

    public function fortuneTowne()
    {
        return Inertia::render('Campus/FortuneTowne/Index');
    }
}



