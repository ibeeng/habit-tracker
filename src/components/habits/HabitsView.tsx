import { Archive, ArchiveRestore, Pencil, Trash2, Plus, Sparkles } from 'lucide-react'
import { useHabits } from '../../store/useHabits'
import { calculateStreak } from '../../lib/streaks'
import { isCompleted } from '../../lib/models'
import { isoToday } from '../../lib/dates'
import { Panel, PromptLine } from '../ui/bits'
import { RoutineIcon } from '../../lib/routine-icons'
import { cn } from '../../lib/utils'

export function HabitsView() {
  const { state, setOpenForm, setOpenTemplatePicker, archiveHabit, deleteHabit, selectedId, setSelectedId } = useHabits()
  const today = isoToday()
  const active = state.habits.filter((h) => !h.archived)
  const archived = state.habits.filter((h) => h.archived)

  if (state.habits.length === 0) {
    return (
      <Panel>
        <PromptLine>list --all</PromptLine>
        <p className="mt-3 text-dim text-sm">
          {'// empty. '}
          <button
            onClick={() => setOpenForm('new')}
            className="text-accent underline underline-offset-2"
          >
            create one
          </button>
        </p>
      </Panel>
    )
  }

  const renderRow = (h: (typeof state.habits)[number]) => {
    const streak = calculateStreak(state, h)
    const doneToday = isCompleted(h, state.completions, today)
    return (
      <div
        key={h.id}
        onClick={() => setSelectedId(h.id)}
        className={cn(
          'flex items-center gap-3 px-2.5 py-2 border rounded-sm group cursor-pointer',
          selectedId === h.id ? 'border-accent bg-accent/10' : 'border-border bg-panel',
          h.archived && 'opacity-50',
        )}
      >
        <span className={cn('w-8 text-center text-sm font-bold', doneToday ? 'text-accent' : 'text-muted')}>
          [{doneToday ? '✓' : ' '}]
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-fg truncate">{h.name}</div>
          <div className="text-[10px] text-dim flex gap-2 flex-wrap mt-0.5">
            <span className="text-accent2">{h.mode}</span>
            <span>{h.schedule.type}</span>
            {h.goal != null && (
              <span className="tnum">
                goal {h.goal}
                {h.unit ? ` ${h.unit}` : ''}
              </span>
            )}
            {h.routineId &&
              (() => {
                const r = state.routines.find((x) => x.id === h.routineId)
                return r ? (
                  <span className="text-warn inline-flex items-center gap-1">
                    <RoutineIcon icon={r.icon} className="w-4 h-4 text-warn" />
                    {r.name}
                  </span>
                ) : null
              })()}
          </div>
        </div>
        <div className="text-right text-xs tnum shrink-0">
          <div className={streak.streak > 0 ? 'text-accent font-bold' : 'text-muted'}>
            {streak.streak > 0 ? `${streak.streak}d` : '—'}
          </div>
          <div className="text-[9px] text-muted">streak</div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpenForm(h)
            }}
            className="p-1 text-dim hover:text-accent"
            title="edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              archiveHabit(h.id)
            }}
            className="p-1 text-dim hover:text-warn"
            title={h.archived ? 'restore' : 'archive'}
          >
            {h.archived ? (
              <ArchiveRestore className="w-3.5 h-3.5" />
            ) : (
              <Archive className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`delete "${h.name}" and all its history?`)) deleteHabit(h.id)
            }}
            className="p-1 text-dim hover:text-danger"
            title="delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex items-center justify-between mb-3">
          <PromptLine>list --all</PromptLine>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenTemplatePicker(true)}
              className="flex items-center gap-1 text-xs text-accent2 hover:opacity-80"
              title="browse habit templates"
            >
              <Sparkles className="w-3 h-3" /> templates
            </button>
            <button
              onClick={() => setOpenForm('new')}
              className="flex items-center gap-1 text-xs text-accent hover:opacity-80"
            >
              <Plus className="w-3 h-3" /> new
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          {active.map(renderRow)}
          {active.length === 0 && (
            <p className="text-xs text-dim">{'// no active habits'}</p>
          )}
        </div>
      </Panel>

      {archived.length > 0 && (
        <Panel>
          <div className="label-caps mb-2">archived</div>
          <div className="space-y-1.5">{archived.map(renderRow)}</div>
        </Panel>
      )}

      {state.routines.length > 0 && (
        <Panel>
          <div className="label-caps mb-2">routines</div>
          <div className="space-y-1">
            {state.routines.map((r) => {
              const count = state.habits.filter((h) => h.routineId === r.id && !h.archived).length
              return (
                <div key={r.id} className="flex items-center justify-between text-xs py-1">
                  <span className="text-fg inline-flex items-center gap-1.5">
                    <RoutineIcon icon={r.icon} className="w-4 h-4 text-accent" />
                    {r.name}
                  </span>
                  <span className="text-dim tnum">{count} habits</span>
                </div>
              )
            })}
          </div>
        </Panel>
      )}
    </div>
  )
}
