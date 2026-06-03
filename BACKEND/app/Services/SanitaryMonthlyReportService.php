<?php

namespace App\Services;

use App\Models\Routine;
use App\Models\Task;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class SanitaryMonthlyReportService
{
    public const SYSTEM_NAME = 'MHMIXX VISA CONTROLL';

    public const COMPANY_NAME = 'MHMIXX Açaí e Frutas';

    private const REPORTABLE_DAYS = [1, 3, 5];

    /**
     * Feriados fixos no formato `m-d` que devem ser excluídos do relatório.
     */
    private const REPORTABLE_HOLIDAYS = [
        '05-01',
        '06-04',
    ];

    public function build(Routine $routine, int $month, int $year): array
    {
        $reference = CarbonImmutable::create($year, $month, 1, 0, 0, 0, config('app.timezone', 'America/Sao_Paulo'));
        $taskData = $this->taskPayload($routine);
        $tasksByDate = Task::query()
            ->with(['completedBy'])
            ->where('routine_id', $routine->id)
            ->whereYear('scheduled_date', $year)
            ->whereMonth('scheduled_date', $month)
            ->get()
            ->keyBy(fn (Task $task) => $task->scheduled_date?->toDateString());

        return [
            'systemName' => self::SYSTEM_NAME,
            'companyName' => self::COMPANY_NAME,
            'referenceMonth' => $month,
            'referenceYear' => $year,
            'referenceLabel' => $reference->format('m/Y'),
            'referenceMonthName' => $reference->locale('pt_BR')->translatedFormat('F \d\e Y'),
            'reportTitle' => $this->reportTitleForRoutine($routine),
            'reportSectionTitle' => $this->reportSectionTitleForRoutine($routine),
            'reportSectionDescription' => $this->reportSectionDescriptionForRoutine($routine),
            'task' => $taskData,
            'control' => $taskData,
            'issuedAt' => now()->toIso8601String(),
            'issuedAtLabel' => now()->format('d/m/Y H:i'),
            'rows' => $this->buildRows($reference, $routine, $tasksByDate),
            'operationalSections' => [],
            'signatureLine' => 'Responsável pela conferência',
            'conferenceDateLine' => 'Data da conferência',
        ];
    }

    public function availableTasks(): Collection
    {
        return Routine::query()
            ->where('is_active', true)
            ->where('category', 'CLEANING')
            ->where('frequency', '3X_WEEK')
            ->orderBy('name')
            ->get();
    }

    public function availableControls(): Collection
    {
        return $this->availableTasks();
    }

    public function availableOperationalControls(): Collection
    {
        return Routine::query()
            ->where('is_active', true)
            ->where('category', 'VERIFICATION')
            ->where('frequency', 'DAILY')
            ->whereIn('name', [
                'Controle de Temperatura',
                'Checklist EPI',
            ])
            ->orderByRaw("CASE name WHEN 'Controle de Temperatura' THEN 0 WHEN 'Checklist EPI' THEN 1 ELSE 2 END")
            ->get();
    }

    public function periodicityLabel(string $frequency): string
    {
        return match ($frequency) {
            'DAILY' => 'Diariamente',
            '3X_WEEK' => '3 vezes por semana',
            'WEEKLY' => 'Semanalmente',
            default => $frequency,
        };
    }

    /**
     * @return array<int, CarbonImmutable>
     */
    public function plannedDatesForMonth(int $month, int $year): array
    {
        $reference = CarbonImmutable::create($year, $month, 1, 0, 0, 0, config('app.timezone', 'America/Sao_Paulo'));
        $dates = [];
        $cursor = $reference->startOfMonth();
        $end = $reference->endOfMonth();

        while ($cursor->lessThanOrEqualTo($end)) {
            if ($this->isReportableDate($cursor)) {
                $dates[] = $cursor;
            }

            $cursor = $cursor->addDay();
        }

        return $dates;
    }

    private function taskPayload(Routine $routine): array
    {
        return [
            'id' => $routine->id,
            'name' => $routine->name,
            'frequency' => $routine->frequency,
            'periodicity' => $this->periodicityLabel($routine->frequency),
            'category' => $routine->category,
            'sector' => $routine->sector,
            'shift' => $routine->shift,
        ];
    }

    /**
     * @param  array<int, CarbonImmutable>  $plannedDates
     * @param  \Illuminate\Support\Collection<string, Task>  $tasksByDate
     * @return array<int, array<string, string>>
     */
    private function buildRows(CarbonImmutable $reference, Routine $routine, Collection $tasksByDate): array
    {
        $plannedDates = $this->plannedDatesForRoutine($routine, (int) $reference->month, (int) $reference->year);
        $responsible = $this->defaultResponsibleForRoutine($routine);
        $isTemperatureRoutine = $routine->name === 'Controle de Temperatura';

        return collect($plannedDates)
            ->map(function (CarbonImmutable $date) use ($routine, $tasksByDate, $responsible, $isTemperatureRoutine) {
                $task = $tasksByDate->get($date->toDateString());

                $row = [
                    'plannedDate' => $date->toDateString(),
                    'plannedDateLabel' => $date->format('d/m/Y'),
                    'taskName' => $routine->name,
                    'responsible' => $responsible ?: ($task?->completedBy?->name ?? ''),
                    'observations' => $task?->observation ?? '',
                    'signature' => '',
                ];

                if ($isTemperatureRoutine) {
                    $row['temperatureCamera01'] = '';
                    $row['temperatureCamera02'] = '';
                }

                return $row;
            })
            ->values()
            ->all();
    }

    private function buildOperationalSections(CarbonImmutable $reference, Routine $selectedRoutine): array
    {
        return $this->availableOperationalControls()
            ->reject(fn (Routine $routine) => $routine->id === $selectedRoutine->id)
            ->map(function (Routine $routine) use ($reference) {
                $kind = $this->operationalKind($routine);

                return [
                    'id' => $routine->id,
                    'name' => $routine->name,
                    'title' => $this->operationalTitle($routine),
                    'description' => $this->operationalDescription($routine),
                    'kind' => $kind,
                    'routine' => $this->taskPayload($routine),
                    'rows' => $this->buildOperationalRows($reference, $routine, $kind),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function buildOperationalRows(CarbonImmutable $reference, Routine $routine, string $kind): array
    {
        $responsible = match ($kind) {
            'temperature' => 'LEONARDO',
            default => 'ROSENEIDA',
        };

        return collect($this->plannedDatesForRoutine($routine, (int) $reference->month, (int) $reference->year))
            ->map(function (CarbonImmutable $date) use ($routine, $kind, $responsible) {
                return [
                    'plannedDate' => $date->toDateString(),
                    'plannedDateLabel' => $date->format('d/m/Y'),
                    'taskName' => $routine->name,
                    'kind' => $kind,
                    'temperature' => '',
                    'responsible' => $responsible,
                    'observations' => '',
                    'signature' => '',
                ];
            })
            ->values()
            ->all();
    }

    private function operationalKind(Routine $routine): string
    {
        return str_contains(mb_strtolower($routine->name, 'UTF-8'), 'temperatura')
            ? 'temperature'
            : 'verification';
    }

    private function operationalTitle(Routine $routine): string
    {
        return match ($this->operationalKind($routine)) {
            'temperature' => 'Controle de Temperatura das Câmaras Frias',
            default => 'Verificação de EPI',
        };
    }

    private function operationalDescription(Routine $routine): string
    {
        return match ($this->operationalKind($routine)) {
            'temperature' => 'Preencher manualmente as temperaturas diárias e identificar o responsável pela conferência.',
            default => 'Registrar a conferência diária de EPI, com campo para responsável e assinatura.',
        };
    }

    /**
     * @return array<int, CarbonImmutable>
     */
    private function plannedDatesForRoutine(Routine $routine, int $month, int $year): array
    {
        return $routine->frequency === 'DAILY'
            ? $this->plannedWorkdaysForMonth($month, $year)
            : $this->plannedDatesForMonth($month, $year);
    }

    /**
     * @return array<int, CarbonImmutable>
     */
    private function plannedWorkdaysForMonth(int $month, int $year): array
    {
        $reference = CarbonImmutable::create($year, $month, 1, 0, 0, 0, config('app.timezone', 'America/Sao_Paulo'));
        $dates = [];
        $cursor = $reference->startOfMonth();
        $end = $reference->endOfMonth();

        while ($cursor->lessThanOrEqualTo($end)) {
            if ($cursor->dayOfWeekIso <= 5 && ! in_array($cursor->format('m-d'), self::REPORTABLE_HOLIDAYS, true)) {
                $dates[] = $cursor;
            }

            $cursor = $cursor->addDay();
        }

        return $dates;
    }

    private function defaultResponsibleForRoutine(Routine $routine): string
    {
        return match ($routine->name) {
            'Checklist EPI' => 'ROSENEIDA',
            'Controle de Temperatura' => 'LEONARDO',
            default => '',
        };
    }

    private function reportTitleForRoutine(Routine $routine): string
    {
        return match ($routine->name) {
            'Checklist EPI' => 'Relatório Mensal de Verificação de EPI',
            'Controle de Temperatura' => 'Relatório Mensal de Controle de Temperatura das Câmaras Frias',
            default => 'Relatório Mensal de Execução de Tarefa Sanitária',
        };
    }

    private function reportSectionTitleForRoutine(Routine $routine): string
    {
        return match ($routine->name) {
            'Checklist EPI' => 'Verificação de EPI',
            'Controle de Temperatura' => 'Controle de Temperatura das Câmaras Frias',
            default => $routine->name,
        };
    }

    private function reportSectionDescriptionForRoutine(Routine $routine): string
    {
        return match ($routine->name) {
            'Checklist EPI' => 'Registrar a conferência diária de EPI, com campo para responsável e assinatura.',
            'Controle de Temperatura' => 'Preencher manualmente as temperaturas diárias e identificar o responsável pela conferência.',
            default => '',
        };
    }

    private function isReportableDate(CarbonImmutable $date): bool
    {
        return in_array($date->dayOfWeekIso, self::REPORTABLE_DAYS, true)
            && ! in_array($date->format('m-d'), self::REPORTABLE_HOLIDAYS, true);
    }
}
