<?php

namespace Database\Seeders;

use App\Models\AppLog;
use App\Models\Issue;
use App\Models\Routine;
use App\Models\Task;
use App\Models\User;
use App\Support\AppLogger;
use Carbon\CarbonInterface;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MhmixxControlSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->withTrashed()->updateOrCreate(
            ['email' => 'admin@mhmixxx.com'],
            [
                'name' => 'Administrador',
                'phone' => '(12) 99111-0001',
                'role' => 'ADMIN',
                'status' => 'ACTIVE',
                'last_login_at' => now()->subHours(4),
                'password' => Hash::make('123456'),
                'deleted_at' => null,
            ]
        );

        $joao = User::query()->withTrashed()->updateOrCreate(
            ['email' => 'joao@mhmixxx.com'],
            [
                'name' => 'Joao Silva',
                'phone' => '(12) 99111-0002',
                'role' => 'EMPLOYEE',
                'status' => 'ACTIVE',
                'last_login_at' => now()->subMinutes(90),
                'password' => Hash::make('123456'),
                'deleted_at' => null,
            ]
        );

        $maria = User::query()->withTrashed()->updateOrCreate(
            ['email' => 'maria@mhmixxx.com'],
            [
                'name' => 'Maria Santos',
                'phone' => '(12) 99111-0003',
                'role' => 'EMPLOYEE',
                'status' => 'ACTIVE',
                'last_login_at' => now()->subDay(),
                'password' => Hash::make('123456'),
                'deleted_at' => null,
            ]
        );

        collect([
            ['name' => 'BRYAN', 'email' => 'bryan@mhmixxx.com'],
            ['name' => 'LEONARDO', 'email' => 'leonardo@mhmixxx.com'],
            ['name' => 'GABRIEL', 'email' => 'gabriel@mhmixxx.com'],
            ['name' => 'ROSENEIDA', 'email' => 'roseneida@mhmixxx.com'],
            ['name' => 'RENICELI', 'email' => 'reniceli@mhmixxx.com'],
            ['name' => 'CELIA', 'email' => 'celia@mhmixxx.com'],
            ['name' => 'DRIELE', 'email' => 'driele@mhmixxx.com'],
            ['name' => 'TATIANE', 'email' => 'tatiane@mhmixxx.com'],
        ])->each(function (array $user): void {
            User::query()->withTrashed()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'role' => 'EMPLOYEE',
                    'status' => 'ACTIVE',
                    'last_login_at' => null,
                    'password' => Hash::make('123456'),
                    'deleted_at' => null,
                ]
            );
        });

        $routines = collect([
            [
                'name' => 'CONTROLE DE HIGIENIZAÇÃO DAS PAREDES',
                'aliases' => ['Limpeza de Paredes'],
                'frequency' => '3X_WEEK',
                'category' => 'CLEANING',
                'sector' => 'EXPEDICAO',
                'shift' => 'PRODUCAO',
            ],
            [
                'name' => 'LIMPEZA DOS TETOS',
                'aliases' => ['Limpeza de Tetos'],
                'frequency' => '3X_WEEK',
                'category' => 'CLEANING',
                'sector' => 'LIMPEZA GERAL',
                'shift' => 'FECHAMENTO',
            ],
            [
                'name' => 'CONTROLE DE HIGIENIZAÇÃO DE TOMADAS, JANELAS, PORTAS, TELAS E INTERRUPTORES',
                'aliases' => ['Higiene Geral (Janelas, Tomadas, Portas)'],
                'frequency' => '3X_WEEK',
                'category' => 'CLEANING',
                'sector' => 'AREA DE PRODUCAO',
                'shift' => 'PRODUCAO',
            ],
            [
                'name' => 'LIMPEZA DOS RALOS E LIXEIRAS',
                'aliases' => ['Higienizacao de Ralos e Lixeiras'],
                'frequency' => '3X_WEEK',
                'category' => 'CLEANING',
                'sector' => 'LIMPEZA GERAL',
                'shift' => 'PRODUCAO',
            ],
            [
                'name' => 'CONTROLE DE HIGIENIZAÇÃO DE FREEZERS E CÂMARAS FRIAS',
                'aliases' => ['Limpeza de Freezers e Camara Fria'],
                'frequency' => '3X_WEEK',
                'category' => 'CLEANING',
                'sector' => 'FREEZERS',
                'shift' => 'FECHAMENTO',
            ],
            [
                'name' => 'Controle de Temperatura',
                'aliases' => [],
                'frequency' => 'DAILY',
                'category' => 'VERIFICATION',
                'sector' => 'CAMARA FRIA',
                'shift' => 'ABERTURA',
            ],
            [
                'name' => 'Checklist EPI',
                'aliases' => [],
                'frequency' => 'DAILY',
                'category' => 'VERIFICATION',
                'sector' => 'PRODUCAO',
                'shift' => 'ABERTURA',
            ],
        ])->map(function (array $routine) {
            $routineModel = Routine::query()
                ->where('name', $routine['name'])
                ->first();

            if (! $routineModel && ! empty($routine['aliases'])) {
                $routineModel = Routine::query()
                    ->whereIn('name', $routine['aliases'])
                    ->orderBy('id')
                    ->first();
            }

            if ($routineModel) {
                $routineModel->update([
                    'name' => $routine['name'],
                    'frequency' => $routine['frequency'],
                    'category' => $routine['category'],
                    'sector' => $routine['sector'],
                    'shift' => $routine['shift'],
                    'is_active' => true,
                ]);

                return $routineModel;
            }

            return Routine::query()->create([
                'name' => $routine['name'],
                'frequency' => $routine['frequency'],
                'category' => $routine['category'],
                'sector' => $routine['sector'],
                'shift' => $routine['shift'],
                'is_active' => true,
            ]);
        });

        foreach (range(0, 6) as $offset) {
            $date = now()->subDays($offset)->startOfDay();

            foreach ($routines as $index => $routine) {
                if (! $this->shouldGenerateTask($routine->frequency, $date)) {
                    continue;
                }

                $status = 'PENDING';
                $completedAt = null;
                $completedBy = null;
                $observation = null;

                if ($offset === 0 && $index === 0) {
                    $status = 'COMPLETED';
                    $completedAt = now()->subHour();
                    $completedBy = $joao->id;
                    $observation = 'Limpeza concluida e superficies sanitizadas.';
                } elseif ($offset === 0 && $index === 1) {
                    $status = 'LATE';
                } elseif ($offset > 0) {
                    $status = ($index + $offset) % 4 === 0 ? 'LATE' : 'COMPLETED';
                    $completedAt = $status === 'COMPLETED'
                        ? $date->copy()->setTime(8 + ($index % 5), 15)
                        : null;
                    $completedBy = $status === 'COMPLETED'
                        ? ($index % 2 === 0 ? $joao->id : $maria->id)
                        : null;
                    $observation = $status === 'COMPLETED'
                        ? 'Execucao registrada via rotina operacional.'
                        : null;
                }

                Task::query()->updateOrCreate(
                    [
                        'routine_id' => $routine->id,
                        'scheduled_date' => $date->toDateString(),
                    ],
                    [
                        'status' => $status,
                        'completed_at' => $completedAt,
                        'completed_by' => $completedBy,
                        'observation' => $observation,
                    ]
                );
            }
        }

        $issue = Issue::query()->updateOrCreate(
            ['description' => 'Freezer 2 com temperatura a -12C'],
            [
                'category' => 'EQUIPMENT',
                'status' => 'OPEN',
                'reported_by' => $joao->id,
                'reported_at' => now()->subHours(2),
            ]
        );

        Issue::query()->updateOrCreate(
            ['description' => 'Luvas termicas com desgaste no posto de expedicao'],
            [
                'category' => 'EPI',
                'status' => 'RESOLVED',
                'reported_by' => $maria->id,
                'reported_at' => now()->subDay()->setTime(9, 30),
                'resolved_by' => $admin->id,
                'resolved_at' => now()->subDay()->setTime(11, 0),
                'action' => 'Reposicao do EPI e orientacao da equipe realizada.',
            ]
        );

        AppLog::query()->delete();
        AppLogger::log($joao, 'ISSUE_REPORTED', $issue->description, now()->subHours(2));
        AppLogger::log($joao, 'TASK_COMPLETED', 'Limpeza de Freezers e Camara Fria', now()->subHour());
        AppLogger::log($admin, 'LOGIN', 'Acesso via painel administrativo', now()->subHours(4));
    }

    private function shouldGenerateTask(string $frequency, CarbonInterface $date): bool
    {
        return match ($frequency) {
            'DAILY' => true,
            '3X_WEEK' => in_array($date->dayOfWeekIso, [1, 3, 5], true),
            'WEEKLY' => $date->dayOfWeekIso === 1,
            default => false,
        };
    }
}
