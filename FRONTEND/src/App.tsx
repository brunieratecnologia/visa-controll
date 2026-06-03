import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/lib/store'

import Layout from './components/Layout'
import Index from './pages/Index'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import ChecklistMobile from './pages/ChecklistMobile'
import Employees from './pages/Employees'
import Routines from './pages/Routines'
import Issues from './pages/Issues'
import Reports from './pages/Reports'
import NotFound from './pages/NotFound'

const App = () => (
  <AppProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tarefas" element={<Tasks />} />
            <Route path="/checklist-mobile" element={<ChecklistMobile />} />
            <Route path="/funcionarios" element={<Employees />} />
            <Route path="/rotinas" element={<Routines />} />
            <Route path="/nao-conformidades" element={<Issues />} />
            <Route path="/relatorios" element={<Reports />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AppProvider>
)

export default App
