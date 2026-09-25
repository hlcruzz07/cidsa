<?php

namespace App\Enums;

enum ActivityLogType: string
{
    case LOGIN = 'login';
    case SYNC_DATA = 'sync_data';
    case EXPORT = 'export';
    case PRINT = 'print';
}
