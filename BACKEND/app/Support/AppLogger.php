<?php

namespace App\Support;

use App\Models\AppLog;
use App\Models\User;
use Carbon\CarbonInterface;

class AppLogger
{
    public static function log(?User $user, string $action, string $details, ?CarbonInterface $loggedAt = null): AppLog
    {
        return AppLog::create([
            'action' => $action,
            'user_id' => $user?->id,
            'details' => $details,
            'logged_at' => $loggedAt ?? now(),
        ]);
    }
}
