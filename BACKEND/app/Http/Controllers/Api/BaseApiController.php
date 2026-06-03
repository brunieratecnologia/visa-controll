<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

abstract class BaseApiController extends Controller
{
    protected function actorFromRequest(Request $request): User
    {
        $actorId = $request->integer('current_user_id') ?: $request->integer('user_id');

        abort_if(! $actorId, 422, 'Usuario autenticado nao informado.');

        $user = User::query()->findOrFail($actorId);

        throw_if($user->status !== 'ACTIVE', new HttpException(403, 'Usuario inativo.'));

        return $user;
    }

    protected function ensureAdmin(User $user): void
    {
        abort_if($user->role !== 'ADMIN', 403, 'Acao permitida apenas para administradores.');
    }
}
