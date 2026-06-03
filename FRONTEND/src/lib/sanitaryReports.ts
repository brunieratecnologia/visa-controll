import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Routine,
  SanitaryControlOption,
  SanitaryMonthlyReport,
  SanitaryOperationalReportSection,
  SanitaryOperationalReportRow,
  SanitaryReportRow,
} from '@/types'

const reportableDays = [1, 3, 5]
const reportableHolidays = ['05-01', '06-04']

export const monthOptions = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
].map((label, index) => ({ value: index + 1, label }))

export const buildYearOptions = (currentYear = new Date().getFullYear()) =>
  Array.from({ length: 7 }, (_, index) => currentYear - 3 + index)

export const routineToSanitaryControl = (routine: Routine): SanitaryControlOption => ({
  id: routine.id,
  name: routine.name,
  frequency: routine.frequency,
  periodicity:
    routine.frequency === '3X_WEEK'
      ? '3 vezes por semana'
      : routine.frequency === 'DAILY'
        ? 'Diariamente'
        : routine.frequency,
  category: routine.category,
  sector: routine.sector,
  shift: routine.shift,
})

const buildPlannedDates = (month: number, year: number, frequency: Routine['frequency']) => {
  const cursor = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  const dates: string[] = []

  while (cursor <= end) {
    const dayKey = format(cursor, 'MM-dd')

    const isReportable =
      frequency === 'DAILY'
        ? cursor.getDay() >= 1 && cursor.getDay() <= 5 && !reportableHolidays.includes(dayKey)
        : reportableDays.includes(cursor.getDay()) && !reportableHolidays.includes(dayKey)

    if (isReportable) {
      dates.push(format(cursor, 'yyyy-MM-dd'))
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

export const buildSanitaryRows = (month: number, year: number, control: SanitaryControlOption): SanitaryReportRow[] => {
  return buildPlannedDates(month, year, control.frequency).map((plannedDate) => ({
    plannedDate,
    plannedDateLabel: format(new Date(`${plannedDate}T12:00:00`), 'dd/MM/yyyy'),
    taskName: control.name,
    responsible:
      control.name === 'Checklist EPI'
        ? 'ROSENEIDA'
        : control.name === 'Controle de Temperatura'
          ? 'LEONARDO'
          : '',
    temperatureCamera01: control.name === 'Controle de Temperatura' ? '' : undefined,
    temperatureCamera02: control.name === 'Controle de Temperatura' ? '' : undefined,
    observations: '',
    signature: '',
  }))
}

const buildOperationalRows = (
  month: number,
  year: number,
  taskName: string,
  responsible: string,
): SanitaryOperationalReportRow[] => {
  return buildPlannedDates(month, year, 'DAILY').map((plannedDate) => ({
    plannedDate,
    plannedDateLabel: format(new Date(`${plannedDate}T12:00:00`), 'dd/MM/yyyy'),
    taskName,
    responsible,
    temperature: '',
    observations: '',
    signature: '',
  }))
}

const buildOperationalSections = (month: number, year: number): SanitaryOperationalReportSection[] => [
  {
    id: 1,
    name: 'Controle de Temperatura',
    title: 'Controle de Temperatura das Câmaras Frias',
    description: 'Preencher manualmente as temperaturas diárias e identificar o responsável pela conferência.',
    kind: 'temperature',
    routine: {
      id: 1,
      name: 'Controle de Temperatura',
      frequency: 'DAILY',
      periodicity: 'Diariamente',
      category: 'VERIFICATION',
      sector: 'CAMARA FRIA',
      shift: 'ABERTURA',
    },
    rows: buildOperationalRows(month, year, 'Controle de Temperatura', 'LEONARDO'),
  },
  {
    id: 2,
    name: 'Checklist EPI',
    title: 'Verificação de EPI',
    description: 'Registrar a conferência diária de EPI, com campo para responsável e assinatura.',
    kind: 'verification',
    routine: {
      id: 2,
      name: 'Checklist EPI',
      frequency: 'DAILY',
      periodicity: 'Diariamente',
      category: 'VERIFICATION',
      sector: 'PRODUCAO',
      shift: 'ABERTURA',
    },
    rows: buildOperationalRows(month, year, 'Checklist EPI', 'ROSENEIDA'),
  },
]

export const buildFallbackReport = (control: SanitaryControlOption, month: number, year: number): SanitaryMonthlyReport => {
  const reportDate = new Date()

  return {
    systemName: 'MHMIXX VISA CONTROLL',
    companyName: 'MHMIXX Açaí e Frutas',
    referenceMonth: month,
    referenceYear: year,
    referenceLabel: `${String(month).padStart(2, '0')}/${year}`,
    referenceMonthName: format(new Date(year, month - 1, 1), "MMMM 'de' yyyy", { locale: ptBR }),
    reportTitle:
      control.name === 'Checklist EPI'
        ? 'Relatório Mensal de Verificação de EPI'
        : control.name === 'Controle de Temperatura'
          ? 'Relatório Mensal de Controle de Temperatura das Câmaras Frias'
          : 'Relatório Mensal de Execução de Tarefa Sanitária',
    reportSectionTitle:
      control.name === 'Checklist EPI'
        ? 'Verificação de EPI'
        : control.name === 'Controle de Temperatura'
          ? 'Controle de Temperatura das Câmaras Frias'
          : control.name,
    reportSectionDescription:
      control.name === 'Checklist EPI'
        ? 'Registrar a conferência diária de EPI, com campo para responsável e assinatura.'
        : control.name === 'Controle de Temperatura'
          ? 'Preencher manualmente as temperaturas diárias e identificar o responsável pela conferência.'
          : '',
    task: {
      id: control.id,
      name: control.name,
      frequency: control.frequency,
      periodicity: control.periodicity,
      category: control.category,
      sector: control.sector,
      shift: control.shift,
    },
    control: {
      id: control.id,
      name: control.name,
      frequency: control.frequency,
      periodicity: control.periodicity,
      category: control.category,
      sector: control.sector,
      shift: control.shift,
    },
    issuedAt: reportDate.toISOString(),
    issuedAtLabel: format(reportDate, 'dd/MM/yyyy HH:mm'),
    rows: buildSanitaryRows(month, year, control),
    operationalSections: [],
    signatureLine: 'Responsável pela conferência',
    conferenceDateLine: 'Data da conferência',
  }
}
