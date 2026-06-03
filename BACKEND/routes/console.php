<?php

use App\Services\SanitaryAprilBackfillService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('sanitary:generate-monthly-reports {--month=4} {--year=}', function () {
    $service = app(SanitaryAprilBackfillService::class);
    $year = (int) ($this->option('year') ?: now()->year);
    $month = (int) ($this->option('month') ?: 4);

    if ($month < 1 || $month > 12) {
        $this->error('Informe um mês entre 1 e 12.');

        return 1;
    }

    $result = $service->generate($year, $month);

    $this->info(sprintf('Geração manual concluída para %02d/%d.', $result['month'], $result['year']));
    $this->line("Registros removidos de datas não reportáveis: {$result['removed']}");
    $this->line("Registros criados: {$result['created']}");
    $this->line("Registros atualizados: {$result['updated']}");
    $this->line("Registros já existentes preservados: {$result['skipped']}");
})->purpose('Gera manualmente os registros mensais para relatórios sanitários');

Artisan::command('sanitary:generate-april-reports {--year=}', function () {
    $service = app(SanitaryAprilBackfillService::class);
    $year = (int) ($this->option('year') ?: now()->year);
    $result = $service->generate($year, 4);

    $this->info("Geração manual de abril concluída para {$result['year']}.");
    $this->line("Registros removidos de datas não reportáveis: {$result['removed']}");
    $this->line("Registros criados: {$result['created']}");
    $this->line("Registros atualizados: {$result['updated']}");
    $this->line("Registros já existentes preservados: {$result['skipped']}");
})->purpose('Gera manualmente os registros de abril para relatórios sanitários');
