<?php

namespace App\Enums;

enum PrintingType: string
{
    case NEW_STUDENT = 'new_student';
    case REPLACEMENT_STUDENT = 'replacement_student';
    case EMPLOYEE = 'employee';
}