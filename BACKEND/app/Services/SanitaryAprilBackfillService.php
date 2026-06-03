<?php

namespace App\Services;

use App\Models\Routine;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;

class SanitaryAprilBackfillService
{
    private const FREEZER_POOL = ['BRYAN', 'LEONARDO', 'GABRIEL'];

    private const GENERAL_POOL = ['ROSENEIDA', 'RENICELI', 'CELIA', 'DRIELE', 'TATIANE'];

    public function __construct(private readonly SanitaryMonthlyReportService $reportService)
    {
    }

    public function generate(int $year, int $month = 4): array
    {
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $routines = $this->reportService->availableTasks();
        $users = $this->ensureUsers();
        $dates = $this->reportService->plannedDatesForMonth($month, $year);
        $datesByString = collect($dates)->map(fn ($date) => $date->toDateString())->values()->all();
        $routineIds = $routines->pluck('id')->all();

        $removed = Task::query()
            ->whereIn('routine_id', $routineIds)
            ->whereYear('scheduled_date', $year)
            ->whereMonth('scheduled_date', $month)
            ->whereNotIn('scheduled_date', $datesByString)
            ->delete();

        foreach ($routines as $routine) {
            $pool = $this->userPoolForRoutine($routine, $users);
            $poolNames = $pool->pluck('name')->all();

            foreach ($dates as $index => $date) {
                $task = Task::query()
                    ->where('routine_id', $routine->id)
                    ->whereDate('scheduled_date', $date->toDateString())
                    ->first();

                if ($task) {
                    $currentAssignee = $task->completed_by
                        ? User::withTrashed()->find($task->completed_by)
                        : null;

                    if (! $currentAssignee || $currentAssignee->trashed() || ! in_array($currentAssignee->name, $poolNames, true)) {
                        $task->fill([
                            'completed_by' => Arr::random($pool->all())->id,
                            'completed_at' => $task->completed_at ?? $date->copy()->setTime(8 + ($index % 5), 15),
                            'status' => $task->status ?? 'COMPLETED',
                        ])->save();

                        $updated++;
                    } else {
                        $skipped++;
                    }

                    continue;
                }

                $assignee = Arr::random($pool->all());
                $completedAt = $date->copy()->setTime(8 + ($index % 5), 15);

                Task::query()->create([
                    'routine_id' => $routine->id,
                    'scheduled_date' => $date->toDateString(),
                    'status' => 'COMPLETED',
                    'completed_at' => $completedAt,
                    'completed_by' => $assignee->id,
                    'observation' => null,
                ]);

                $created++;
            }
        }

        return [
            'year' => $year,
            'month' => $month,
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'removed' => $removed,
        ];
    }

    private function ensureUsers(): Collection
    {
        $definitions = [
            ['name' => 'BRYAN', 'email' => 'bryan@mhmixxx.com'],
            ['name' => 'LEONARDO', 'email' => 'leonardo@mhmixxx.com'],
            ['name' => 'GABRIEL', 'email' => 'gabriel@mhmixxx.com'],
            ['name' => 'ROSENEIDA', 'email' => 'roseneida@mhmixxx.com'],
            ['name' => 'RENICELI', 'email' => 'reniceli@mhmixxx.com'],
            ['name' => 'CELIA', 'email' => 'celia@mhmixxx.com'],
            ['name' => 'DRIELE', 'email' => 'driele@mhmixxx.com'],
            ['name' => 'TATIANE', 'email' => 'tatiane@mhmixxx.com'],
        ];

        return collect($definitions)->map(
            fn (array $definition) => User::query()->updateOrCreate(
                ['email' => $definition['email']],
                [
                    'name' => $definition['name'],
                    'role' => 'EMPLOYEE',
                    'status' => 'ACTIVE',
                    'password' => Hash::make('123456'),
                    'deleted_at' => null,
                ]
            )
        );
    }

    private function userPoolForRoutine(Routine $routine, Collection $users): Collection
    {
        $name = mb_strtolower($routine->name.' '.$routine->sector, 'UTF-8');
        $freezerKeywords = ['freezer', 'freezers', 'camara fria', 'camara frias', 'câmara fria', 'câmaras frias'];

        $allowedNames = collect($freezerKeywords)->contains(
            fn (string $keyword) => str_contains($name, $keyword)
        )
            ? self::FREEZER_POOL
            : self::GENERAL_POOL;

        return $users->filter(fn (User $user) => in_array($user->name, $allowedNames, true))->values();
    }
}
