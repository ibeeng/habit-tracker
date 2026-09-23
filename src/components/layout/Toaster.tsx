import { useHabits } from '../../store/useHabits'
import { cn } from '../../lib/utils'

export function Toaster() {
  const { toasts } = useHabits()
  if (toasts.length === 0) return null
  return (
    <div className="fixed left-3 right-3 sm:left-auto sm:right-4 bottom-20 sm:bottom-4 z-50 flex flex-col gap-2 sm:max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'toast-in px-3 py-2 text-xs border rounded-sm bg-panel shadow-lg sm:ml-auto',
            t.kind === 'achievement' ? 'border-warn text-warn' : 'border-accent text-accent',
          )}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
