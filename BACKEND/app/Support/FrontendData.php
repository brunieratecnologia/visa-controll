<?php

namespace App\Support;

use App\Models\AppLog;
use App\Models\Issue;
use App\Models\Routine;
use App\Models\Task;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class FrontendData
{
    public static function user(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'status' => $user->status,
            'lastLogin' => optional($user->last_login_at)?->toIso8601String(),
        ];
    }

    public static function routine(Routine $routine): array
    {
        return [
            'id' => $routine->id,
            'name' => $routine->name,
            'frequency' => $routine->frequency,
            'category' => $routine->category,
            'sector' => $routine->sector,
            'shift' => $routine->shift,
            'isActive' => $routine->is_active,
        ];
    }

    public static function task(Task $task): array
    {
        return [
            'id' => $task->id,
            'routineId' => $task->routine_id,
            'routineName' => $task->routine?->name,
            'routineSector' => $task->routine?->sector,
            'routineShift' => $task->routine?->shift,
            'date' => $task->scheduled_date?->toDateString(),
            'status' => $task->status,
            'completedAt' => optional($task->completed_at)?->toIso8601String(),
            'completedBy' => $task->completedBy?->name,
            'observation' => $task->observation,
            'photoUrl' => PublicFileStorage::url($task->photo_path),
        ];
    }

    public static function issue(Issue $issue): array
    {
        return [
            'id' => $issue->id,
            'description' => $issue->description,
            'category' => $issue->category,
            'reason' => $issue->reason,
            'photoUrl' => PublicFileStorage::url($issue->photo_path),
            'action' => $issue->action,
            'resolutionPhotoUrl' => PublicFileStorage::url($issue->resolution_photo_path),
            'status' => $issue->status,
            'reportedBy' => $issue->reporter?->name,
            'reportedAt' => optional($issue->reported_at)?->toIso8601String(),
        ];
    }

    public static function log(AppLog $log): array
    {
        return [
            'id' => $log->id,
            'action' => $log->action,
            'user' => $log->user?->name ?? 'Sistema',
            'timestamp' => optional($log->logged_at)?->toIso8601String(),
            'details' => $log->details,
        ];
    }

    public static function weeklyData(Collection $tasks, CarbonInterface $endDate): array
    {
        return collect(range(6, 0))->reverse()
            ->map(function (int $offset) use ($tasks, $endDate) {
                $date = $endDate->copy()->subDays(6 - $offset)->startOfDay();
                $dayTasks = $tasks->filter(
                    fn (Task $task) => $task->scheduled_date?->isSameDay($date)
                );

                return [
                    'name' => mb_strtolower($date->locale('pt_BR')->translatedFormat('D')),
                    'concluidas' => $dayTasks->where('status', 'COMPLETED')->count(),
                    'pendentes' => $dayTasks->whereIn('status', ['PENDING', 'LATE'])->count(),
                ];
            })
            ->values()
            ->all();
    }
}
