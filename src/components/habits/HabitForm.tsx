import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useHabits, type HabitInput } from '../../store/useHabits'
import type { Schedule, ScheduleType, TrackingMode } from '../../lib/models'
import { isoToday } from '../../lib/dates'
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

const ROUTINE_ICONS = [
  '🎯', '🌅', '☀️', '🌙', '😴', '🛏️', '💪', '🏋️', '🚶', '🏃', '🤸', '🧘',
  '💧', '☕', '🍵', '💊', '🍽️', '🥞', '🍜', '🍲', '🥗', '🚿', '🪥', '🧴',
  '💻', '📚', '📖', '🎯', '🧠', '📓', '📝', '🙏', '🚬', '🔍', '📋', '📅', '📆', '✅',
] as const

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
  const [newRoutineIcon, setNewRoutineIcon] = useState<typeof ROUTINE_ICONS[number]>('🎯')

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
      className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto overscroll-contain fade-in"
      onClick={close}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-panel border border-border rounded-sm w-full max-w-lg p-4 sm:p-5 shadow-2xl my-4 sm:my-8 max-h-[min(92dvh,900px)] overflow-y-auto overscroll-contain"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-accent font-bold text-sm">
            $ {editing ? 'habit --edit' : 'habit --new'}
            <span className="cursor-blink">_</span>
          </h2>
          <button type="button" onClick={close} className="text-dim hover:text-fg p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

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
                  <span>{r.icon}</span> {r.name}
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
          <div className="mt-2 flex gap-1.5">
            <div className="flex-1 flex items-center gap-1 bg-bg2 border border-border rounded-sm px-1.5 py-0.5">
              <input
                value={newRoutine}
                onChange={(e) => setNewRoutine(e.target.value)}
                placeholder="name"
                className="flex-1 bg-transparent text-xs text-fg placeholder:text-muted focus:outline-none"
              />
              <select
                value={newRoutineIcon}
                onChange={(e) => setNewRoutineIcon(e.target.value as typeof ROUTINE_ICONS[number])}
                className="bg-bg border border-border rounded-sm px-1 py-0.5 text-xs text-dim"
                title="icon"
              >
                {ROUTINE_ICONS.map((ic) => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!newRoutine.trim()) return
                const id = addRoutine({ name: newRoutine.trim(), icon: newRoutineIcon })
                setRoutineId(id)
                setNewRoutine('')
                setNewRoutineIcon('🎯')
              }}
              className="px-2 py-1 border border-border rounded-sm text-xs text-dim hover:text-accent hover:border-accent"
            >
              add
            </button>
          </div>
        </div>

        <div className="flex gap-2 justify-end border-t border-border pt-3">
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
