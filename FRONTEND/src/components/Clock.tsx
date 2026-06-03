import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock as ClockIcon } from 'lucide-react'

export function Clock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
      <ClockIcon className="h-4 w-4 text-primary" />
      <span>{format(time, "dd 'de' MMMM, HH:mm:ss", { locale: ptBR })}</span>
    </div>
  )
}
