<?php

namespace App\Http\Controllers\Api;

use App\Models\Routine;
use App\Support\AppLogger;
use App\Support\FrontendData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoutineController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $actor = $this->actorFromRequest($request);
        $this->ensureAdmin($actor);

        return response()->json([
            'routines' => Routine::query()
                ->orderByDesc('is_active')
                ->orderBy('name')
                ->get()
                ->map(fn (Routine $routine) => FrontendData::routine($routine))
                ->values()
                ->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $actor = $this->actorFromRequest($request);
        $this->ensureAdmin($actor);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:routines,name'],
            'frequency' => ['required', Rule::in(['DAILY', '3X_WEEK', 'WEEKLY'])],
            'category' => ['required', Rule::in(['CLEANING', 'MAINTENANCE', 'VERIFICATION'])],
            'sector' => ['required', 'string', 'max:255'],
            'shift' => ['required', Rule::in(['ABERTURA', 'PRODUCAO', 'FECHAMENTO'])],
            'is_active' => ['required', 'boolean'],
        ]);

        $routine = Routine::create([
            'name' => $data['name'],
            'frequency' => $data['frequency'],
            'category' => $data['category'],
            'sector' => $data['sector'],
            'shift' => $data['shift'],
            'is_active' => $data['is_active'],
        ]);

        AppLogger::log($actor, 'ROUTINE_CREATED', 'Nova rotina cadastrada: '.$routine->name);

        return response()->json([
            'routine' => FrontendData::routine($routine),
        ], 201);
    }

    public function update(Request $request, Routine $routine): JsonResponse
    {
        $actor = $this->actorFromRequest($request);
        $this->ensureAdmin($actor);

        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('routines', 'name')->ignore($routine->id),
            ],
            'frequency' => ['required', Rule::in(['DAILY', '3X_WEEK', 'WEEKLY'])],
            'category' => ['required', Rule::in(['CLEANING', 'MAINTENANCE', 'VERIFICATION'])],
            'sector' => ['required', 'string', 'max:255'],
            'shift' => ['required', Rule::in(['ABERTURA', 'PRODUCAO', 'FECHAMENTO'])],
            'is_active' => ['required', 'boolean'],
        ]);

        $routine->update([
            'name' => $data['name'],
            'frequency' => $data['frequency'],
            'category' => $data['category'],
            'sector' => $data['sector'],
            'shift' => $data['shift'],
            'is_active' => $data['is_active'],
        ]);

        AppLogger::log($actor, 'ROUTINE_UPDATED', 'Rotina atualizada: '.$routine->name);

        return response()->json([
            'routine' => FrontendData::routine($routine->fresh()),
        ]);
    }

    public function destroy(Request $request, Routine $routine): JsonResponse
    {
        $actor = $this->actorFromRequest($request);
        $this->ensureAdmin($actor);

        $routineName = $routine->name;
        $routine->update(['is_active' => false]);

        AppLogger::log($actor, 'ROUTINE_DELETED', 'Rotina desativada: '.$routineName);

        return response()->json([
            'message' => 'Rotina desativada com sucesso.',
        ]);
    }
}
