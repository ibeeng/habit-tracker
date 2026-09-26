import { CalendarCheck, BarChart3, ListChecks, NotebookPen, Plus } from 'lucide-react'
import { useHabits, type Tab } from '../../store/useHabits'
import { cn } from '../../lib/utils'

const ITEMS: { id: Tab; label: string; icon: typeof CalendarCheck }[] = [
  { id: 'today', label: 'today', icon: CalendarCheck },
  { id: 'stats', label: 'stats', icon: BarChart3 },
  { id: 'habits', label: 'all', icon: ListChecks },
  { id: 'journal', label: 'journal', icon: NotebookPen },
]

export function BottomNav() {
  const { tab, setTab, setOpenForm } = useHabits()

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-bg2/95 backdrop-blur"
      style={{ paddingBottom: 'var(--sab)' }}
      aria-label="primary"
    >
      <div className="flex items-stretch h-14 max-w-lg mx-auto">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0 transition-colors',
                active ? 'text-accent' : 'text-dim',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.6} />
              <span className={cn('text-[10px] leading-none', active && 'font-bold')}>
                {item.label}
              </span>
              <span
                className={cn(
                  'w-4 h-0.5 rounded-full mt-0.5 transition-colors',
                  active ? 'bg-accent' : 'bg-transparent',
                )}
              />
            </button>
          )
        })}

        {/* FAB-style new habit */}
        <button
          onClick={() => setOpenForm('new')}
          className="flex items-center justify-center w-14 shrink-0"
          aria-label="new habit"
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-bg shadow-lg active:scale-95 transition-transform">
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </span>
        </button>
      </div>
    </nav>
  )
}
