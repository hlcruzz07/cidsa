<?php

namespace App\Enums;

enum UserRole: string
{
    case SUPER_ADMIN = 'super admin';
    case ADMIN = 'admin';
}
