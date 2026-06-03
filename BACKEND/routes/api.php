<?php

use App\Http\Controllers\Api\AppStateController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\IssueController;
use App\Http\Controllers\Api\RoutineController;
use App\Http\Controllers\Api\SanitaryReportController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);

Route::get('/app-state', AppStateController::class);
Route::get('/routines', [RoutineController::class, 'index']);
Route::post('/routines', [RoutineController::class, 'store']);
Route::put('/routines/{routine}', [RoutineController::class, 'update']);
Route::delete('/routines/{routine}', [RoutineController::class, 'destroy']);
Route::get('/sanitary-reports/monthly', [SanitaryReportController::class, 'show']);
Route::post('/tasks/{task}/complete', [TaskController::class, 'complete']);
Route::post('/tasks/{task}/update', [TaskController::class, 'update']);
Route::post('/issues', [IssueController::class, 'store']);
Route::post('/issues/{issue}/resolve', [IssueController::class, 'resolve']);
Route::post('/users', [UserController::class, 'store']);
Route::put('/users/{user}', [UserController::class, 'update']);
Route::delete('/users/{user}', [UserController::class, 'destroy']);
