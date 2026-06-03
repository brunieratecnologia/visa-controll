<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Support\AppLogger;
use App\Support\FrontendData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends BaseApiController
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('email', $data['email'])
            ->first();

        abort_if(! $user || ! Hash::check($data['password'], $user->password), 422, 'Credenciais inválidas.');
        abort_if($user->status !== 'ACTIVE', 403, 'Usuário inativo.');

        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        AppLogger::log($user, 'LOGIN', 'Acesso ao sistema');

        return response()->json([
            'user' => FrontendData::user($user->fresh()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $this->actorFromRequest($request);

        AppLogger::log($user, 'LOGOUT', 'Saída do sistema');

        return response()->json([
            'message' => 'Logout registrado com sucesso.',
        ]);
    }
}
