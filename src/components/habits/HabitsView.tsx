import { Plus, Sparkles } from 'lucide-react'
import { useHabits } from '../../store/useHabits'
import { Panel, PromptLine } from '../ui/bits'
import { RoutineIcon } from '../../lib/routine-icons'
import { SwipeableHabitRow } from './SwipeableHabitRow'

export function HabitsView() {
  const { state, setOpenForm, setOpenTemplatePicker, selectedId, setSelectedId } = useHabits()
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
    return (
      <SwipeableHabitRow
        key={h.id}
        habit={h}
        selected={selectedId === h.id}
        onSelect={() => setSelectedId(h.id)}
      />
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
