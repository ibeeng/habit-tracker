import { useMemo } from 'react'
import { useHabits } from '../../store/useHabits'
import { isCompleted, type Habit } from '../../lib/models'
import { isoToday, formatDate } from '../../lib/dates'
import { calculateStreak } from '../../lib/streaks'
import { levelInfo } from '../../lib/xp'
import { AsciiBar, Panel, PromptLine } from '../ui/bits'
import { RoutineIcon } from '../../lib/routine-icons'
import { HabitRow } from './HabitRow'

export function TodayView() {
  const { state, dueToday, selectedId, setSelectedId, setOpenForm, setOpenTemplatePicker } = useHabits()
  const today = isoToday()
  const lvl = levelInfo(state.xp)

  const done = dueToday.filter((h) => isCompleted(h, state.completions, today)).length
  const total = dueToday.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const routines = state.routines
  const grouped = useMemo(() => {
    const inRoutine = new Map<string, Habit[]>()
    const loose: Habit[] = []
    for (const h of dueToday) {
      if (h.routineId) {
        const arr = inRoutine.get(h.routineId) ?? []
        arr.push(h)
        inRoutine.set(h.routineId, arr)
      } else {
        loose.push(h)
      }
    }
    return { inRoutine, loose }
  }, [dueToday])

  if (state.habits.length === 0) {
    return (
      <div className="space-y-4">
        <Panel>
          <PromptLine>daily</PromptLine>
          <p className="mt-3 text-dim text-sm">
            {'// no habits yet. '}
            <button
              onClick={() => setOpenForm('new')}
              className="text-accent underline underline-offset-2 hover:opacity-80"
            >
              $ init --day-1
            </button>
            {' to create your first habit, or '}
            <button
              onClick={() => setOpenTemplatePicker(true)}
              className="text-accent2 underline underline-offset-2 hover:opacity-80"
            >
              browse templates
            </button>
            {' for quick start.'}
          </p>
          <pre className="mt-4 text-[10px] sm:text-[11px] text-muted leading-tight overflow-x-auto max-w-full">{`
                 _   _
 _ __ ___   ___ | |_(_)_ __   ___   version 0.1.0
| '__/ _ \\ / _ \\| __| | '_ \\ / _ \\
| | | (_) | (_) | |_| | | | |  __/
|_|  \\___/ \\___/ \\__|_|_| |_|\\___|
`}</pre>
        </Panel>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* progress header */}
      <Panel>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <PromptLine>daily</PromptLine>
            <div className="mt-1 text-dim text-xs">{formatDate(new Date(), 'EEEE, MMMM d yyyy')}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-accent tnum">
              {pct}% <span className="text-sm text-dim font-normal">[{done}/{total}]</span>
            </div>
            <div className="text-[11px] text-dim mt-0.5">
              <AsciiBar pct={pct} width={16} />
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-border pt-3">
          <div>
            <div className="label-caps">streak best</div>
            <div className="text-accent tnum font-bold">
              {Math.max(0, ...state.habits.map((h) => calculateStreak(state, h).streak))}d
            </div>
          </div>
          <div>
            <div className="label-caps">level</div>
            <div className="text-accent2 tnum font-bold">{lvl.level}</div>
          </div>
          <div>
            <div className="label-caps">shields</div>
            <div className="text-warn tnum font-bold">◆ {state.shields}</div>
          </div>
          <div>
            <div className="label-caps">xp</div>
            <div className="text-fg tnum font-bold">{state.xp}</div>
          </div>
        </div>
      </Panel>

      {/* routines */}
      {routines.map((r) => {
        const habits = grouped.inRoutine.get(r.id) ?? []
        if (habits.length === 0) return null
        const rDone = habits.filter((h) => isCompleted(h, state.completions, today)).length
        return (
          <section key={r.id} className="space-y-1">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-bold text-accent2 uppercase tracking-widest flex items-center gap-1.5">
                {r.icon && <RoutineIcon icon={r.icon} className="w-4 h-4 text-accent" />}
                {r.name}
                <span className="text-dim font-normal normal-case tracking-normal tnum">
                  [{rDone}/{habits.length}]
                </span>
              </h2>
              <AsciiBar pct={(rDone / habits.length) * 100} width={8} />
            </div>
            <div className="space-y-1">
              {habits.map((h) => (
                <HabitRow
                  key={h.id}
                  habit={h}
                  selected={selectedId === h.id}
                  onSelect={() => setSelectedId(h.id)}
                />
              ))}
            </div>
          </section>
        )
      })}

      {/* loose habits */}
      {grouped.loose.length > 0 && (
        <section className="space-y-1">
          {(routines.length > 0 || grouped.inRoutine.size > 0) && (
            <h2 className="text-xs font-bold text-dim uppercase tracking-widest">// ungrouped</h2>
          )}
          <div className="space-y-1">
            {grouped.loose.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                selected={selectedId === h.id}
                onSelect={() => setSelectedId(h.id)}
              />
            ))}
          </div>
        </section>
      )}

      {dueToday.length === 0 && (
        <Panel className="text-dim text-sm">
          {'// nothing due today — '}
          <span className="text-accent">[ok]</span> rest mode
        </Panel>
      )}

      <p className="text-[11px] text-muted">
        {'// goal: 100% · '}
        {done >= total && total > 0 ? (
          <span className="text-accent">full_day logged ✓</span>
        ) : (
          <span>{total - done} left</span>
        )}
      </p>
    </div>
  )
}
