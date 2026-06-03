import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  AppLog,
  AppStatePayload,
  DashboardData,
  Issue,
  IssueCreatePayload,
  IssueResolvePayload,
  Routine,
  Task,
  TaskCompletionPayload,
  User,
  UserPayload,
} from '@/types'
import { apiRequest } from '@/lib/api'

interface AppState {
  currentUser: User | null
  users: User[]
  tasks: Task[]
  issues: Issue[]
  routines: Routine[]
  logs: AppLog[]
  dashboard: DashboardData
  isBootstrapping: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  completeTask: (taskId: number, payload: TaskCompletionPayload) => Promise<void>
  updateTask: (taskId: number, payload: TaskCompletionPayload & { removePhoto?: boolean }) => Promise<void>
  addIssue: (issue: IssueCreatePayload) => Promise<void>
  resolveIssue: (issueId: number, payload: IssueResolvePayload) => Promise<void>
  addUser: (user: UserPayload) => Promise<string>
  updateUser: (userId: number, user: UserPayload) => Promise<void>
  deleteUser: (userId: number) => Promise<void>
  refreshState: () => Promise<void>
}

const STORAGE_KEY = 'mhmixx-control-user-id'

const emptyDashboard: DashboardData = {
  stats: { total: 0, pending: 0, late: 0, issuesOpen: 0 },
  weeklyData: [],
}

const AppContext = createContext<AppState | undefined>(undefined)

const buildFormData = (entries: Record<string, unknown>) => {
  const formData = new FormData()

  Object.entries(entries).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    formData.append(key, value as string | Blob)
  })

  return formData
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [routines, setRoutines] = useState<Routine[]>([])
  const [logs, setLogs] = useState<AppLog[]>([])
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const applyPayload = (payload: AppStatePayload) => {
    setCurrentUser(payload.currentUser)
    setUsers(payload.users)
    setTasks(payload.tasks)
    setIssues(payload.issues)
    setRoutines(payload.routines)
    setLogs(payload.logs)
    setDashboard(payload.dashboard)
  }

  const clearState = () => {
    setCurrentUser(null)
    setUsers([])
    setTasks([])
    setIssues([])
    setRoutines([])
    setLogs([])
    setDashboard(emptyDashboard)
  }

  const loadStateForUser = async (userId: number) => {
    const payload = await apiRequest<AppStatePayload>(`/app-state?user_id=${userId}`)
    applyPayload(payload)
    window.localStorage.setItem(STORAGE_KEY, String(payload.currentUser.id))
  }

  useEffect(() => {
    const bootstrap = async () => {
      const savedUserId = window.localStorage.getItem(STORAGE_KEY)

      if (!savedUserId) {
        setIsBootstrapping(false)
        return
      }

      try {
        await loadStateForUser(Number(savedUserId))
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
        clearState()
      } finally {
        setIsBootstrapping(false)
      }
    }

    void bootstrap()
  }, [])

  const refreshState = async () => {
    if (!currentUser) return
    await loadStateForUser(currentUser.id)
  }

  const login = async (email: string, password: string) => {
    const response = await apiRequest<{ user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })

    await loadStateForUser(response.user.id)
  }

  const logout = async () => {
    const userId = currentUser?.id

    if (userId) {
      try {
        await apiRequest<{ message: string }>('/auth/logout', {
          method: 'POST',
          body: { current_user_id: userId },
        })
      } catch {
        // local logout should still proceed
      }
    }

    window.localStorage.removeItem(STORAGE_KEY)
    clearState()
  }

  const completeTask = async (taskId: number, payload: TaskCompletionPayload) => {
    if (!currentUser) return

    const formData = buildFormData({
      current_user_id: String(currentUser.id),
      observation: payload.observation,
      photo: payload.photo ?? undefined,
    })

    await apiRequest(`/tasks/${taskId}/complete`, {
      method: 'POST',
      body: formData,
    })

    await loadStateForUser(currentUser.id)
  }

  const updateTask = async (taskId: number, payload: TaskCompletionPayload & { removePhoto?: boolean }) => {
    if (!currentUser) return

    const formData = buildFormData({
      current_user_id: String(currentUser.id),
      observation: payload.observation,
      photo: payload.photo ?? undefined,
      remove_photo: payload.removePhoto ? '1' : undefined,
    })

    await apiRequest(`/tasks/${taskId}/update`, {
      method: 'POST',
      body: formData,
    })

    await loadStateForUser(currentUser.id)
  }

  const addIssue = async (issue: IssueCreatePayload) => {
    if (!currentUser) return

    const formData = buildFormData({
      current_user_id: String(currentUser.id),
      description: issue.description,
      category: issue.category,
      status: issue.status,
      reason: issue.reason,
      photo: issue.photo ?? undefined,
    })

    await apiRequest('/issues', {
      method: 'POST',
      body: formData,
    })

    await loadStateForUser(currentUser.id)
  }

  const resolveIssue = async (issueId: number, payload: IssueResolvePayload) => {
    if (!currentUser) return

    const formData = buildFormData({
      current_user_id: String(currentUser.id),
      action: payload.action,
      photo: payload.photo ?? undefined,
    })

    await apiRequest(`/issues/${issueId}/resolve`, {
      method: 'POST',
      body: formData,
    })

    await loadStateForUser(currentUser.id)
  }

  const addUser = async (user: UserPayload) => {
    if (!currentUser) return ''

    const response = await apiRequest<{ defaultPassword: string }>('/users', {
      method: 'POST',
      body: {
        current_user_id: currentUser.id,
        ...user,
        phone: user.phone || undefined,
        password: user.password || undefined,
      },
    })

    await loadStateForUser(currentUser.id)

    return response.defaultPassword
  }

  const updateUser = async (userId: number, user: UserPayload) => {
    if (!currentUser) return

    await apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: {
        current_user_id: currentUser.id,
        ...user,
        phone: user.phone || undefined,
        password: user.password || undefined,
      },
    })

    await loadStateForUser(currentUser.id)
  }

  const deleteUser = async (userId: number) => {
    if (!currentUser) return

    await apiRequest(`/users/${userId}`, {
      method: 'DELETE',
      body: {
        current_user_id: currentUser.id,
      },
    })

    await loadStateForUser(currentUser.id)
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        tasks,
        issues,
        routines,
        logs,
        dashboard,
        isBootstrapping,
        login,
        logout,
        completeTask,
        updateTask,
        addIssue,
        resolveIssue,
        addUser,
        updateUser,
        deleteUser,
        refreshState,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppStore = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppStore must be used within AppProvider')
  return context
}
