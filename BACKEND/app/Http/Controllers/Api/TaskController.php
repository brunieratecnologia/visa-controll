<?php

namespace App\Http\Controllers\Api;

use App\Models\Task;
use App\Support\AppLogger;
use App\Support\FrontendData;
use App\Support\PublicFileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends BaseApiController
{
    public function complete(Request $request, Task $task): JsonResponse
    {
        $actor = $this->actorFromRequest($request);

        $data = $request->validate([
            'observation' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,image/heic,image/heif', 'max:10240'],
        ]);

        $task->loadMissing('routine');

        $photoPath = PublicFileStorage::storeEventPhoto($request->file('photo'), 'uploads/tasks');

        $task->update([
            'status' => 'COMPLETED',
            'completed_at' => now(),
            'completed_by' => $actor->id,
            'observation' => $data['observation'] ?? null,
            'photo_path' => $photoPath ?: $task->photo_path,
        ]);

        AppLogger::log($actor, 'TASK_COMPLETED', $task->routine->name);

        return response()->json([
            'task' => FrontendData::task($task->fresh(['routine', 'completedBy'])),
        ]);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $actor = $this->actorFromRequest($request);
        $this->ensureAdmin($actor);

        $data = $request->validate([
            'observation' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,image/heic,image/heif', 'max:10240'],
            'remove_photo' => ['nullable', 'boolean'],
        ]);

        $task->loadMissing('routine');

        $payload = [
            'observation' => $data['observation'] ?? null,
        ];

        if ($request->boolean('remove_photo') && $task->photo_path) {
            PublicFileStorage::delete($task->photo_path);
            $payload['photo_path'] = null;
        }

        if ($request->hasFile('photo')) {
            PublicFileStorage::delete($task->photo_path);
            $payload['photo_path'] = PublicFileStorage::storeEventPhoto($request->file('photo'), 'uploads/tasks');
        }

        $task->update($payload);

        AppLogger::log($actor, 'TASK_UPDATED', 'Tarefa ajustada: '.$task->routine->name);

        return response()->json([
            'task' => FrontendData::task($task->fresh(['routine', 'completedBy'])),
        ]);
    }
}
