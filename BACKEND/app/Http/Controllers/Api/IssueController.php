<?php

namespace App\Http\Controllers\Api;

use App\Models\Issue;
use App\Support\AppLogger;
use App\Support\FrontendData;
use App\Support\PublicFileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IssueController extends BaseApiController
{
    public function store(Request $request): JsonResponse
    {
        $actor = $this->actorFromRequest($request);

        $data = $request->validate([
            'description' => ['required', 'string', 'max:2000'],
            'category' => ['required', 'in:EPI,EQUIPMENT,CLEANING,OTHER'],
            'status' => ['nullable', 'in:OPEN,IN_PROGRESS,RESOLVED'],
            'reason' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,image/heic,image/heif', 'max:10240'],
        ]);

        $issue = Issue::create([
            'description' => $data['description'],
            'category' => $data['category'],
            'reason' => $data['reason'] ?? null,
            'photo_path' => PublicFileStorage::storeEventPhoto($request->file('photo'), 'uploads/issues'),
            'status' => $data['status'] ?? 'OPEN',
            'reported_by' => $actor->id,
            'reported_at' => now(),
        ]);

        AppLogger::log($actor, 'ISSUE_REPORTED', $issue->description);

        return response()->json([
            'issue' => FrontendData::issue($issue->fresh(['reporter'])),
        ], 201);
    }

    public function resolve(Request $request, Issue $issue): JsonResponse
    {
        $actor = $this->actorFromRequest($request);
        $this->ensureAdmin($actor);

        $data = $request->validate([
            'action' => ['required', 'string', 'max:2000'],
            'photo' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,image/heic,image/heif', 'max:10240'],
        ]);

        $issue->update([
            'status' => 'RESOLVED',
            'action' => $data['action'],
            'resolved_by' => $actor->id,
            'resolved_at' => now(),
            'resolution_photo_path' => PublicFileStorage::storeEventPhoto($request->file('photo'), 'uploads/issues/resolutions') ?: $issue->resolution_photo_path,
        ]);

        AppLogger::log($actor, 'ISSUE_RESOLVED', 'Resolvido: '.$issue->description);

        return response()->json([
            'issue' => FrontendData::issue($issue->fresh(['reporter'])),
        ]);
    }
}
