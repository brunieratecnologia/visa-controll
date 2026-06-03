export type Role = 'ADMIN' | 'EMPLOYEE'
export type Shift = 'ABERTURA' | 'PRODUCAO' | 'FECHAMENTO'

export interface User {
  id: number
  name: string
  email: string
  phone?: string
  role: Role
  status: 'ACTIVE' | 'INACTIVE'
  lastLogin?: string
}

export interface UserPayload {
  name: string
  email: string
  phone?: string
  role: Role
  status: 'ACTIVE' | 'INACTIVE'
  password?: string
}

export type Frequency = 'DAILY' | '3X_WEEK' | 'WEEKLY'

export interface Routine {
  id: number
  name: string
  frequency: Frequency
  category: 'CLEANING' | 'MAINTENANCE' | 'VERIFICATION'
  sector: string
  shift: Shift
  isActive?: boolean
}

export interface RoutinePayload {
  name: string
  frequency: Frequency
  category: 'CLEANING' | 'MAINTENANCE' | 'VERIFICATION'
  sector: string
  shift: Shift
  isActive: boolean
}

export interface SanitaryControlOption {
  id: number
  name: string
  frequency: Frequency
  periodicity: string
  category: 'CLEANING' | 'MAINTENANCE' | 'VERIFICATION'
  sector: string
  shift: Shift
}

export interface SanitaryReportRow {
  plannedDate: string
  plannedDateLabel: string
  taskName: string
  responsible: string
  temperatureCamera01?: string
  temperatureCamera02?: string
  observations: string
  signature: string
}

export interface SanitaryOperationalReportRow {
  plannedDate: string
  plannedDateLabel: string
  taskName: string
  responsible: string
  temperature: string
  observations: string
  signature: string
}

export interface SanitaryOperationalReportSection {
  id: number
  name: string
  title: string
  description: string
  kind: 'temperature' | 'verification'
  routine: SanitaryControlOption
  rows: SanitaryOperationalReportRow[]
}

export interface SanitaryMonthlyReport {
  systemName: string
  companyName: string
  referenceMonth: number
  referenceYear: number
  referenceLabel: string
  referenceMonthName: string
  reportTitle: string
  reportSectionTitle: string
  reportSectionDescription: string
  task: {
    id: number
    name: string
    frequency: Frequency
    periodicity: string
    category: 'CLEANING' | 'MAINTENANCE' | 'VERIFICATION'
    sector: string
    shift: Shift
  }
  control: {
    id: number
    name: string
    frequency: Frequency
    periodicity: string
    category: 'CLEANING' | 'MAINTENANCE' | 'VERIFICATION'
    sector: string
    shift: Shift
  }
  issuedAt: string
  issuedAtLabel: string
  rows: SanitaryReportRow[]
  operationalSections: SanitaryOperationalReportSection[]
  signatureLine: string
  conferenceDateLine: string
}

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'LATE'

export interface Task {
  id: number
  routineId: number
  routineName: string
  routineSector?: string
  routineShift?: Shift
  date: string
  status: TaskStatus
  completedAt?: string
  completedBy?: string
  observation?: string
  photoUrl?: string
}

export interface TaskCompletionPayload {
  observation?: string
  photo?: File | null
}

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'

export interface Issue {
  id: number
  description: string
  category: 'EPI' | 'EQUIPMENT' | 'CLEANING' | 'OTHER'
  reason?: string
  photoUrl?: string
  action?: string
  resolutionPhotoUrl?: string
  status: IssueStatus
  reportedBy: string
  reportedAt: string
}

export interface IssueCreatePayload {
  description: string
  category: 'EPI' | 'EQUIPMENT' | 'CLEANING' | 'OTHER'
  reason?: string
  status: IssueStatus
  photo?: File | null
}

export interface IssueResolvePayload {
  action: string
  photo?: File | null
}

export interface AppLog {
  id: number
  action: string
  user: string
  timestamp: string
  details: string
}

export interface DashboardStats {
  total: number
  pending: number
  late: number
  issuesOpen: number
}

export interface WeeklyDataPoint {
  name: string
  concluidas: number
  pendentes: number
}

export interface DashboardData {
  stats: DashboardStats
  weeklyData: WeeklyDataPoint[]
}

export interface AppStatePayload {
  currentUser: User
  users: User[]
  tasks: Task[]
  issues: Issue[]
  routines: Routine[]
  logs: AppLog[]
  dashboard: DashboardData
}
