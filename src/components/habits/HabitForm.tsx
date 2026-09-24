import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useHabits, type HabitInput } from '../../store/useHabits'
import type { Schedule, ScheduleType, TrackingMode } from '../../lib/models'
import { isoToday } from '../../lib/dates'
import {
  ROUTINE_ICONS,
  ROUTINE_ICON_KEYS,
  DEFAULT_ROUTINE_ICON,
  RoutineIcon,
  type RoutineIconKey,
} from '../../lib/routine-icons'
import { cn } from '../../lib/utils'

const MODES: { id: TrackingMode; label: string; hint: string }[] = [
  { id: 'checkbox', label: '[✓] checkbox', hint: 'simple done / not done' },
  { id: 'counter', label: '[n/m] counter', hint: 'glasses, reps — with goal' },
  { id: 'number', label: 'number', hint: 'pages, km — target value' },
  { id: 'timer', label: 'timer', hint: 'focused minutes + pomodoro' },
]

const SCHEDULES: { id: ScheduleType; label: string }[] = [
  { id: 'daily', label: 'daily' },
  { id: 'weekly', label: 'weekly' },
  { id: 'biweekly', label: 'biweekly' },
  { id: 'monthly', label: 'monthly' },
]

const WEEKDAYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa']

export function HabitForm() {
  const { openForm, setOpenForm, addHabit, updateHabit, state, addRoutine, deleteRoutine } =
    useHabits()
  const editing = openForm && openForm !== 'new' ? openForm : null

  const [name, setName] = useState(editing?.name ?? '')
  const [mode, setMode] = useState<TrackingMode>(editing?.mode ?? 'checkbox')
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    editing?.schedule.type ?? 'daily',
  )
  const [timesPerWeek, setTimesPerWeek] = useState(editing?.schedule.timesPerWeek ?? 3)
  const [dayOfMonth, setDayOfMonth] = useState(editing?.schedule.dayOfMonth ?? 1)
  const [weekdays, setWeekdays] = useState<number[]>(editing?.schedule.weekdays ?? [])
  const [goal, setGoal] = useState<string>(editing?.goal != null ? String(editing.goal) : '')
  const [unit, setUnit] = useState(editing?.unit ?? '')
  const [routineId, setRoutineId] = useState<string | null>(editing?.routineId ?? null)
  const [startDate, setStartDate] = useState(editing?.schedule.startDate ?? '')
  const [newRoutine, setNewRoutine] = useState('')
  const [newRoutineIcon, setNewRoutineIcon] = useState<RoutineIconKey>(DEFAULT_ROUTINE_ICON)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  if (!openForm) return null

  const close = () => setOpenForm(null)

  const buildSchedule = (): Schedule => {
    const s: Schedule = { type: scheduleType }
    if (scheduleType === 'weekly' || scheduleType === 'biweekly') {
      s.timesPerWeek = timesPerWeek
      if (weekdays.length) s.weekdays = weekdays
    }
    if (scheduleType === 'monthly') s.dayOfMonth = dayOfMonth
    if (scheduleType === 'daily' && weekdays.length) s.weekdays = weekdays
    if (startDate) s.startDate = startDate
    return s
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const input: HabitInput = {
      name: name.trim(),
      mode,
      schedule: buildSchedule(),
      goal: goal ? Number(goal) : undefined,
      unit: unit.trim() || undefined,
      routineId,
    }
    if (editing) updateHabit(editing.id, input)
    else addHabit(input)
  }

  const goalLabel =
    mode === 'timer' ? 'target minutes (e.g. 25)' : mode === 'number' ? 'target value' : 'daily goal'

  return (
    <div
      className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain fade-in modal-open"
      onClick={close}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-panel border border-border rounded-md sm:rounded-sm w-full max-w-lg shadow-2xl my-auto flex flex-col"
        style={{ maxHeight: 'min(92dvh, calc(100dvh - 1.5rem))' }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
          <h2 className="text-accent font-bold text-sm">
            $ {editing ? 'habit --edit' : 'habit --new'}
            <span className="cursor-blink">_</span>
          </h2>
          <button type="button" onClick={close} className="text-dim hover:text-fg p-1 -m-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="px-4 py-4 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >

        <label className="block mb-3">
          <span className="label-caps">name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="meditate 10 min"
            className="mt-1 w-full bg-bg2 border border-border rounded-sm px-2.5 py-1.5 text-sm text-fg placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </label>

        <div className="mb-3">
          <span className="label-caps">tracking mode</span>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  'text-left px-2 py-1.5 border rounded-sm text-xs transition-colors',
                  mode === m.id
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-dim hover:border-muted',
                )}
              >
                <div className="font-bold">{m.label}</div>
                <div className="text-[10px] text-muted mt-0.5">{m.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <span className="label-caps">schedule</span>
          <div className="mt-1 flex gap-1.5 flex-wrap">
            {SCHEDULES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScheduleType(s.id)}
                className={cn(
                  'px-2.5 py-1 border rounded-sm text-xs',
                  scheduleType === s.id
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-border text-dim hover:border-muted',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {(scheduleType === 'weekly' || scheduleType === 'biweekly') && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-dim">goal</span>
              <input
                type="number"
                min={1}
                max={7}
                value={timesPerWeek}
                onChange={(e) => setTimesPerWeek(Number(e.target.value))}
                className="w-14 bg-bg2 border border-border rounded-sm px-1.5 py-1 text-xs text-fg tnum focus:outline-none focus:border-accent"
              />
              <span className="text-xs text-dim">× per week</span>
              <div className="flex gap-1 ml-2">
                {WEEKDAYS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setWeekdays((w) => (w.includes(i) ? w.filter((x) => x !== i) : [...w, i]))
                    }
                    className={cn(
                      'w-7 h-6 text-[10px] border rounded-sm lowercase',
                      weekdays.includes(i)
                        ? 'border-accent text-accent bg-accent/10'
                        : 'border-border text-muted hover:border-muted',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {scheduleType === 'monthly' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-dim">day</span>
              <input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-14 bg-bg2 border border-border rounded-sm px-1.5 py-1 text-xs text-fg tnum focus:outline-none focus:border-accent"
              />
              <span className="text-xs text-dim">of month</span>
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-dim">start (opt)</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-bg2 border border-border rounded-sm px-1.5 py-1 text-xs text-fg focus:outline-none focus:border-accent"
            />
            <span className="text-[10px] text-muted">default: {isoToday()}</span>
          </div>
        </div>

        {mode !== 'checkbox' && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <label>
              <span className="label-caps">{goalLabel}</span>
              <input
                type="number"
                min={1}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={mode === 'timer' ? '25' : mode === 'counter' ? '8' : '20'}
                className="mt-1 w-full bg-bg2 border border-border rounded-sm px-2.5 py-1.5 text-sm text-fg tnum focus:outline-none focus:border-accent"
              />
            </label>
            <label>
              <span className="label-caps">unit</span>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={mode === 'timer' ? 'min' : mode === 'counter' ? 'glasses' : 'pages'}
                className="mt-1 w-full bg-bg2 border border-border rounded-sm px-2.5 py-1.5 text-sm text-fg focus:outline-none focus:border-accent"
              />
            </label>
          </div>
        )}

        <div className="mb-4">
          <span className="label-caps">routine (optional)</span>
          <div className="mt-1 flex gap-1.5 flex-wrap items-center">
            <button
              type="button"
              onClick={() => setRoutineId(null)}
              className={cn(
                'px-2 py-1 border rounded-sm text-xs',
                routineId === null
                  ? 'border-accent text-accent'
                  : 'border-border text-dim hover:border-muted',
              )}
            >
              none
            </button>
            {state.routines.map((r) => (
              <span key={r.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRoutineId(r.id)}
                  className={cn(
                    'px-2 py-1 border rounded-sm text-xs',
                    routineId === r.id
                      ? 'border-accent text-accent'
                      : 'border-border text-dim hover:border-muted',
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <RoutineIcon icon={r.icon} className="w-4 h-4" />
                    {r.name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteRoutine(r.id)}
                  className="ml-0.5 text-[10px] text-muted hover:text-danger"
                  title="delete routine"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5 flex-wrap">
            <div className="flex-1 flex items-center gap-1.5 bg-bg2 border border-border rounded-sm px-1.5 py-0.5 min-w-[140px]">
              <input
                value={newRoutine}
                onChange={(e) => setNewRoutine(e.target.value)}
                placeholder="name"
                className="flex-1 min-w-0 bg-transparent text-xs text-fg placeholder:text-muted focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIconPickerOpen((v) => !v)}
                className="flex items-center justify-center w-7 h-7 border border-border rounded-sm text-accent hover:border-accent shrink-0"
                title="pick icon (lucide · open source)"
                aria-label="pick routine icon"
                aria-expanded={iconPickerOpen}
              >
                <RoutineIcon icon={newRoutineIcon} className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!newRoutine.trim()) return
                const id = addRoutine({ name: newRoutine.trim(), icon: newRoutineIcon })
                setRoutineId(id)
                setNewRoutine('')
                setNewRoutineIcon(DEFAULT_ROUTINE_ICON)
                setIconPickerOpen(false)
              }}
              className="px-2 py-1 border border-border rounded-sm text-xs text-dim hover:text-accent hover:border-accent"
            >
              add
            </button>
          </div>
          {iconPickerOpen && (
            <div className="mt-1.5 border border-border bg-bg2 rounded-sm p-1.5 grid grid-cols-8 sm:grid-cols-10 gap-1 fade-in">
              {ROUTINE_ICON_KEYS.map((key) => {
                const Cmp = ROUTINE_ICONS[key]
                return (
                  <button
                    key={key}
                    type="button"
                    title={key}
                    onClick={() => {
                      setNewRoutineIcon(key)
                      setIconPickerOpen(false)
                    }}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-sm border transition-colors',
                      newRoutineIcon === key
                        ? 'text-accent bg-accent/10 border-accent'
                        : 'text-fg border-border hover:text-accent hover:border-accent',
                    )}
                  >
                    <Cmp className="w-4 h-4" strokeWidth={2.25} />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        </div>

        <div className="flex gap-2 justify-end border-t border-border px-4 py-3 shrink-0" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={close}
            className="px-3 py-1.5 text-xs border border-border rounded-sm text-dim hover:text-fg"
          >
            cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs bg-accent text-bg font-bold rounded-sm hover:opacity-90"
          >
            {editing ? 'save' : 'create'} [↵]
          </button>
        </div>
      </form>
    </div>
  )
}
