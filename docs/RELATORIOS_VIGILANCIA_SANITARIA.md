# Relatórios Mensais da Vigilância Sanitária

## Visão geral

O sistema **MHMIXX VISA CONTROLL** possui uma área de relatórios mensais para gerar documentos de controle sanitário prontos para impressão e arquivamento.

O fluxo é manual:

1. O usuário escolhe o mês.
2. O usuário escolhe o ano.
3. O usuário escolhe o tipo de controle.
4. O sistema monta o relatório mensal.
5. O usuário visualiza e imprime o documento.

## Controles sanitários cadastrados

Os controles abaixo foram padronizados para periodicidade de **3 vezes por semana**:

1. `CONTROLE DE HIGIENIZAÇÃO DAS PAREDES`
2. `LIMPEZA DOS TETOS`
3. `CONTROLE DE HIGIENIZAÇÃO DE TOMADAS, JANELAS, PORTAS, TELAS E INTERRUPTORES`
4. `LIMPEZA DOS RALOS E LIXEIRAS`
5. `CONTROLE DE HIGIENIZAÇÃO DE FREEZERS E CÂMARAS FRIAS`

## Estrutura reutilizada

O projeto reaproveita o cadastro existente de `routines` como base dos controles sanitários.

Também reaproveita `tasks` e `app_logs` para o fluxo operacional já existente.

## Arquivos principais

- `BACKEND/app/Http/Controllers/Api/SanitaryReportController.php`
- `BACKEND/app/Services/SanitaryMonthlyReportService.php`
- `BACKEND/routes/api.php`
- `BACKEND/database/seeders/MhmixxControlSeeder.php`
- `FRONTEND/src/pages/Reports.tsx`
- `FRONTEND/src/lib/sanitaryReports.ts`
- `FRONTEND/src/types/index.ts`

## Como gerar o relatório mensal

1. Acesse a tela **Relatórios Mensais**.
2. Escolha o mês.
3. Escolha o ano.
4. Escolha o controle sanitário.
5. Clique em **Gerar Relatório**.

O sistema monta as linhas do mês usando a periodicidade de `3 vezes por semana`, distribuindo datas úteis em base semanal.

## Como imprimir

1. Gere o relatório.
2. Clique em **Imprimir**.
3. O layout de impressão oculta menus, botões e elementos administrativos.
4. O conteúdo impresso fica em formato A4.

## Geração manual retroativa

Existe um comando manual e pontual para preencher os registros de um mês específico quando necessário:

```bash
php artisan sanitary:generate-monthly-reports --month=5 --year=2026
```

Esse comando:

- não roda automaticamente;
- não está em schedule;
- não cria job recorrente;
- não duplica registros já existentes;
- preserva histórico anterior.

O atalho antigo de abril continua disponível:

```bash
php artisan sanitary:generate-april-reports --year=2026
```

## Rotas

- `GET /api/sanitary-reports/monthly`

Parâmetros esperados:

- `current_user_id`
- `routine_id`
- `month`
- `year`

## Models, controllers e services

- `Routine` continua sendo o cadastro base dos controles.
- `SanitaryReportController` valida a solicitação e responde com o relatório mensal.
- `SanitaryMonthlyReportService` monta o cabeçalho, a periodicidade e as datas do mês.

## Duplicidade

O seeder foi escrito para:

- procurar o controle pelo nome oficial ou por alias antigo;
- atualizar o registro existente quando encontrado;
- criar apenas se não existir.

Isso evita duplicar controles sanitários já cadastrados.

## Observação importante

Não existe rotina automática de preenchimento mensal.

Não foram criados job, schedule, cron ou comando recorrente para preencher relatórios automaticamente.

Uma futura rotina de preenchimento manual retroativo poderá ser implementada mediante solicitação do usuário.
