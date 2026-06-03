<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Support\AppLogger;
use App\Support\FrontendData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends BaseApiController
{
    public function store(Request $request): JsonResponse
    {
        $actor = $this->actorFromRequest($request);
        $this->ensureAdmin($actor);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', 'in:ADMIN,EMPLOYEE'],
            'status' => ['required', 'in:ACTIVE,INACTIVE'],
            'password' => ['nullable', 'string', 'min:6', 'max:255'],
        ]);

        $plainPassword = $data['password'] ?? '123456';

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'role' => $data['role'],
            'status' => $data['status'],
            'password' => Hash::make($plainPassword),
        ]);

        AppLogger::log($actor, 'USER_CREATED', 'Novo usuario: '.$user->name);

        return response()->json([
            'user' => FrontendData::user($user),
            'defaultPassword' => $plainPassword,
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $actor = $this->actorFromRequest($request);
        $this->ensureAdmin($actor);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', 'in:ADMIN,EMPLOYEE'],
            'status' => ['required', 'in:ACTIVE,INACTIVE'],
            'password' => ['nullable', 'string', 'min:6', 'max:255'],
        ]);

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'role' => $data['role'],
            'status' => $data['status'],
        ];

        if (! empty($data['password'])) {
            $payload['password'] = Hash::make($data['password']);
        }

        $user->update($payload);

        AppLogger::log($actor, 'USER_UPDATED', 'Colaborador atualizado: '.$user->name);

        return response()->json([
            'user' => FrontendData::user($user->fresh()),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $actor = $this->actorFromRequest($request);
        $this->ensureAdmin($actor);

        abort_if($actor->id === $user->id, 422, 'Nao e permitido excluir o proprio usuario.');

        $userName = $user->name;
        $user->delete();

        AppLogger::log($actor, 'USER_DELETED', 'Colaborador removido: '.$userName);

        return response()->json([
            'message' => 'Colaborador removido com sucesso.',
        ]);
    }
}
