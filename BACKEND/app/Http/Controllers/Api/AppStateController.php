<?php

namespace App\Http\Controllers\Api;

use App\Models\AppLog;
use App\Models\Issue;
use App\Models\Routine;
use App\Models\Task;
use App\Models\User;
use App\Support\FrontendData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppStateController extends BaseApiController
{
    public function __invoke(Request $request): JsonResponse
    {
        $actor = $this->actorFromRequest($request);
        $today = now()->startOfDay();

        $todayTasks = Task::query()
            ->with(['routine', 'completedBy'])
            ->whereDate('scheduled_date', $today)
            ->orderBy('status')
            ->orderBy('id')
            ->get();

        $weeklyTasks = Task::query()
            ->with(['routine', 'completedBy'])
            ->whereBetween('scheduled_date', [
                $today->copy()->subDays(6)->toDateString(),
                $today->toDateString(),
            ])
            ->get();

        $issues = Issue::query()
            ->with('reporter')
            ->latest('reported_at')
            ->get();

        $logs = AppLog::query()
            ->with('user')
            ->latest('logged_at')
            ->limit(100)
            ->get();

        return response()->json([
            'currentUser' => FrontendData::user($actor),
            'users' => User::query()
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => FrontendData::user($user))
                ->all(),
            'routines' => Routine::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn (Routine $routine) => FrontendData::routine($routine))
                ->all(),
            'tasks' => $todayTasks
                ->map(fn (Task $task) => FrontendData::task($task))
                ->all(),
            'issues' => $issues
                ->map(fn (Issue $issue) => FrontendData::issue($issue))
                ->all(),
            'logs' => $logs
                ->map(fn (AppLog $log) => FrontendData::log($log))
                ->all(),
            'dashboard' => [
                'stats' => [
                    'total' => $todayTasks->count(),
                    'pending' => $todayTasks->where('status', 'PENDING')->count(),
                    'late' => $todayTasks->where('status', 'LATE')->count(),
                    'issuesOpen' => $issues->where('status', 'OPEN')->count(),
                ],
                'weeklyData' => FrontendData::weeklyData($weeklyTasks, $today),
            ],
        ]);
    }
}
