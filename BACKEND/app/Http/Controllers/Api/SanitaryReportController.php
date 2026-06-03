<?php

namespace App\Http\Controllers\Api;

use App\Models\Routine;
use App\Services\SanitaryMonthlyReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SanitaryReportController extends BaseApiController
{
    public function __construct(private readonly SanitaryMonthlyReportService $service)
    {
    }

    public function show(Request $request): JsonResponse
    {
        $this->actorFromRequest($request);

        $data = $request->validate([
            'task_id' => ['nullable', 'integer', 'exists:routines,id'],
            'routine_id' => ['nullable', 'integer', 'exists:routines,id'],
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer', 'between:2020,2100'],
        ]);

        $routineId = $data['task_id'] ?? $data['routine_id'] ?? null;
        abort_if(! $routineId, 422, 'Tarefa sanitária não informada.');

        $routine = Routine::query()
            ->where('id', $routineId)
            ->where('is_active', true)
            ->firstOrFail();

        abort_if(
            ! (
                $routine->category === 'CLEANING' && $routine->frequency === '3X_WEEK'
                || $routine->category === 'VERIFICATION' && $routine->frequency === 'DAILY'
                && in_array($routine->name, ['Controle de Temperatura', 'Checklist EPI'], true)
            ),
            422,
            'Rotina não disponível para relatório.'
        );

        return response()->json([
            'report' => $this->service->build($routine, (int) $data['month'], (int) $data['year']),
            'availableTasks' => $this->service->availableTasks()->map(fn (Routine $task) => [
                'id' => $task->id,
                'name' => $task->name,
                'frequency' => $task->frequency,
                'periodicity' => $this->service->periodicityLabel($task->frequency),
            ])->values()->all(),
            'availableControls' => $this->service->availableControls()->map(fn (Routine $control) => [
                'id' => $control->id,
                'name' => $control->name,
                'frequency' => $control->frequency,
                'periodicity' => $this->service->periodicityLabel($control->frequency),
            ])->values()->all(),
            'availableOperationalControls' => $this->service->availableOperationalControls()->map(fn (Routine $control) => [
                'id' => $control->id,
                'name' => $control->name,
                'frequency' => $control->frequency,
                'periodicity' => $this->service->periodicityLabel($control->frequency),
            ])->values()->all(),
        ]);
    }
}
