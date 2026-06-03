<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    $frontendEntry = public_path('index.html');

    abort_unless(
        File::exists($frontendEntry),
        503,
        'Frontend nao publicado. Gere o build do FRONTEND e copie o conteudo de dist para BACKEND/public.'
    );

    return response(File::get($frontendEntry))->header('Content-Type', 'text/html');
})->where('any', '^(?!api).*$');
