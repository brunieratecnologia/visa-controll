import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { FileText, Printer, RefreshCw, ShieldCheck } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { buildFallbackReport, buildYearOptions, monthOptions, routineToSanitaryControl } from '@/lib/sanitaryReports'
import { Routine, SanitaryMonthlyReport } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

type ReportResponse = {
  report: SanitaryMonthlyReport
  availableTasks?: Array<{
    id: number
    name: string
    frequency: Routine['frequency']
    periodicity: string
  }>
}

export default function Reports() {
  const { currentUser, logs, routines } = useAppStore()
  const taskOptions = useMemo(() => {
    return routines
      .filter((routine) => {
        if (routine.category === 'CLEANING') {
          return routine.frequency === '3X_WEEK'
        }

        return routine.category === 'VERIFICATION'
          && routine.frequency === 'DAILY'
          && ['Controle de Temperatura', 'Checklist EPI'].includes(routine.name)
      })
      .map(routineToSanitaryControl)
  }, [routines])

  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [taskId, setTaskId] = useState('')
  const [emissionDate, setEmissionDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [report, setReport] = useState<SanitaryMonthlyReport | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('relatorio')

  useEffect(() => {
    if (!taskId && taskOptions.length > 0) {
      setTaskId(String(taskOptions[0].id))
    }
  }, [taskId, taskOptions])

  const selectedTask = taskOptions.find((task) => String(task.id) === taskId) ?? null
  const yearOptions = buildYearOptions(now.getFullYear())
  const emissionDateLabel = format(new Date(`${emissionDate}T12:00:00`), 'dd/MM/yyyy')
  const emissionDateIso = new Date(`${emissionDate}T12:00:00`).toISOString()

  const generateReport = async () => {
    if (!currentUser) return
    if (!selectedTask) {
      toast({
        title: 'Selecione uma tarefa',
        description: 'Escolha uma tarefa sanitária para gerar o relatório mensal.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsGenerating(true)
      const response = await apiRequest<ReportResponse>(
        `/sanitary-reports/monthly?current_user_id=${currentUser.id}&task_id=${selectedTask.id}&month=${month}&year=${year}`,
      )

      setReport({
        ...response.report,
        issuedAt: emissionDateIso,
        issuedAtLabel: emissionDateLabel,
      })
      toast({
        title: 'Relatório gerado',
        description: `${response.report.task.name} preparado para ${response.report.referenceLabel}.`,
      })
    } catch (error) {
      const fallbackReport = buildFallbackReport(selectedTask, Number(month), Number(year))
      setReport({
        ...fallbackReport,
        issuedAt: emissionDateIso,
        issuedAtLabel: emissionDateLabel,
      })
      toast({
        title: 'Relatório montado localmente',
        description:
          error instanceof Error
            ? `${error.message} O relatório foi montado em modo local para não bloquear a impressão.`
            : 'O relatório foi montado em modo local para não bloquear a impressão.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    if (!report) {
      toast({
        title: 'Gere um relatório primeiro',
        description: 'Use os filtros e clique em Gerar Relatório antes de imprimir.',
        variant: 'destructive',
      })
      return
    }

    setActiveTab('relatorio')
    window.setTimeout(() => window.print(), 50)
  }

  const taskInfo = report?.task ?? selectedTask
  const taskFrequency = report?.task.periodicity ?? selectedTask?.periodicity ?? '3 vezes por semana'
  const taskResponsible =
    taskInfo?.name === 'Checklist EPI'
      ? 'ROSENEIDA'
      : taskInfo?.name === 'Controle de Temperatura'
        ? 'LEONARDO'
        : ''
  const isTemperatureReport = taskInfo?.name === 'Controle de Temperatura'
  const reportTitle =
    report?.reportTitle ??
    (taskInfo?.name === 'Checklist EPI'
      ? 'Relatório Mensal de Verificação de EPI'
      : taskInfo?.name === 'Controle de Temperatura'
        ? 'Relatório Mensal de Controle de Temperatura das Câmaras Frias'
        : 'Relatório Mensal de Execução de Tarefa Sanitária')

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            MHMIXX VISA CONTROLL
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios Mensais da Vigilância Sanitária</h2>
          <p className="max-w-3xl text-muted-foreground">
            Gere, visualize e imprima relatórios mensais de execução por tarefa sanitária, com dados
            mensais da própria tarefa para arquivamento físico na Pasta da Vigilância Sanitária.
          </p>
        </div>

          <Card className="border-primary/10 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filtros do relatório</CardTitle>
            <CardDescription>
              Selecione manualmente o mês, o ano e a rotina para montar a versão de impressão. As
              rotinas operacionais de temperatura e EPI já aparecem junto das tarefas de limpeza.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ano</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-4">
              <label className="text-sm font-medium">Rotina do relatório</label>
              <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a rotina" />
                </SelectTrigger>
                <SelectContent>
                  {taskOptions.map((task) => (
                    <SelectItem key={task.id} value={String(task.id)}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Data de emissão</label>
              <Input
                type="date"
                value={emissionDate}
                onChange={(event) => setEmissionDate(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Informe manualmente a data que vai constar no relatório impresso.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 md:col-span-4">
              <Button onClick={() => void generateReport()} disabled={isGenerating || !taskOptions.length}>
                {isGenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                Gerar Relatório
              </Button>
              <Button variant="outline" onClick={handlePrint} disabled={!report}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="no-print grid w-full grid-cols-2">
          <TabsTrigger value="relatorio">Relatório mensal</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria operacional</TabsTrigger>
        </TabsList>

        <TabsContent value="relatorio" className="mt-6">
          <Card className="sanitary-report-print print:border-0 print:shadow-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="sanitary-report-header border-b bg-muted/20 px-6 py-4 print:border-black print:bg-white">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="sanitary-report-system text-xs font-semibold uppercase tracking-[0.18em] text-primary print:text-black">
                      {report?.systemName ?? 'MHMIXX VISA CONTROLL'}
                    </p>
                    <h3 className="sanitary-report-title text-2xl font-bold text-foreground print:text-black">
                      {reportTitle}
                    </h3>
                    <p className="sanitary-report-company text-sm text-muted-foreground print:text-black">
                      Empresa: {report?.companyName ?? 'MHMIXX Açaí e Frutas'}
                    </p>
                  </div>

                    <div className="sanitary-report-meta grid gap-1 text-sm text-muted-foreground print:text-black">
                      <p>
                        <span className="font-medium">Tarefa:</span> {taskInfo?.name ?? 'Selecione uma tarefa'}
                      </p>
                      <p>
                        <span className="font-medium">Frequência:</span> {taskFrequency}
                      </p>
                      {taskResponsible ? (
                        <p>
                          <span className="font-medium">Responsável:</span> {taskResponsible}
                        </p>
                      ) : null}
                      <p>
                        <span className="font-medium">Mês/Ano:</span>{' '}
                        {report?.referenceLabel ?? `${month.padStart(2, '0')}/${year}`}
                      </p>
                    <p>
                      <span className="font-medium">Data de emissão:</span>{' '}
                      {report?.issuedAtLabel ?? emissionDateLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="sanitary-report-body px-6 py-4">
                {!report ? (
                  <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground print:border-black print:bg-white">
                    Selecione os filtros e clique em <strong>Gerar Relatório</strong> para visualizar a
                    tabela do mês.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="sanitary-report-summary flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground print:text-black">
                      <Badge variant="secondary" className="print:border print:border-black print:bg-white">
                        {report.rows.length} linhas geradas
                      </Badge>
                      <span>Referência: {report.referenceMonthName}</span>
                    </div>

                    {report.reportSectionTitle ? (
                      <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 print:border-black print:bg-white">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary print:text-black">
                          Seção operacional
                        </p>
                        <h4 className="mt-1 text-lg font-semibold text-foreground print:text-black">
                          {report.reportSectionTitle}
                        </h4>
                        {report.reportSectionDescription ? (
                          <p className="mt-1 text-sm text-muted-foreground print:text-black">
                            {report.reportSectionDescription}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="sanitary-report-table-wrapper rounded-2xl border print:border-black">
                      <Table className="sanitary-report-table">
                        <TableHeader>
                          <TableRow className="bg-muted/40 print:bg-white">
                            <TableHead className="sanitary-col-date">Data prevista</TableHead>
                            {isTemperatureReport ? (
                              <>
                                <TableHead className="sanitary-col-task">Temp. Câmara 01</TableHead>
                                <TableHead className="sanitary-col-task">Temp. Câmara 02</TableHead>
                              </>
                            ) : (
                              <>
                                <TableHead className="sanitary-col-task">Nome da tarefa</TableHead>
                                <TableHead className="sanitary-col-responsible">Colaborador responsável</TableHead>
                              </>
                            )}
                            <TableHead className="sanitary-col-observations">Observações</TableHead>
                            <TableHead className="sanitary-col-signature">Assinatura</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.rows.map((row) => (
                            <TableRow key={row.plannedDate} className="print:border-black sanitary-report-row">
                              <TableCell className="whitespace-nowrap font-medium sanitary-col-date">
                                {row.plannedDateLabel}
                              </TableCell>
                              {isTemperatureReport ? (
                                <>
                                  <TableCell className="text-muted-foreground sanitary-col-task">
                                    {row.temperatureCamera01 || '__________'}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground sanitary-col-task">
                                    {row.temperatureCamera02 || '__________'}
                                  </TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell className="sanitary-col-task">{row.taskName}</TableCell>
                                  <TableCell className="text-muted-foreground sanitary-col-responsible">
                                    {row.responsible || '____________________________'}
                                  </TableCell>
                                </>
                              )}
                              <TableCell className="text-muted-foreground sanitary-col-observations">
                                {row.observations || '\u00A0'}
                              </TableCell>
                              <TableCell className="text-muted-foreground sanitary-col-signature">
                                {'\u00A0'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="sanitary-report-footer rounded-2xl border bg-muted/20 p-3 text-sm print:border-black print:bg-white">
                      <p className="font-semibold text-foreground print:text-black">
                        Documento destinado ao arquivamento físico na Pasta da Vigilância Sanitária.
                      </p>
                      <div className="mt-2 grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground print:text-black">
                            Conferência
                          </p>
                          <p>{report.signatureLine}: ____________________________________</p>
                        </div>
                        <div className="space-y-1 sm:text-center">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground print:text-black">
                            Data
                          </p>
                          <p>{report.conferenceDateLine}: ____/____/________</p>
                        </div>
                        <div className="space-y-1 sm:text-right">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground print:text-black">
                            Assinatura
                          </p>
                          <p><span className="sanitary-signature-line" /></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" /> Histórico de auditoria
              </CardTitle>
              <CardDescription>
                Registro operacional recente mantido para consulta interna do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-b-lg border-t">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Ação / Evento</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Responsável</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.action === 'TASK_COMPLETED'
                            ? 'Tarefa Concluída'
                            : log.action === 'ISSUE_REPORTED'
                              ? 'Ocorrência Registrada'
                              : log.action === 'ISSUE_RESOLVED'
                                ? 'Ocorrência Resolvida'
                                : log.action}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{log.details}</TableCell>
                        <TableCell>{log.user}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
