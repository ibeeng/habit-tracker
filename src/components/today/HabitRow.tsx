import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Square, Minus, Plus } from 'lucide-react'
import { useHabits } from '../../store/useHabits'
import { isCompleted, completionValue, type Habit } from '../../lib/models'
import { calculateStreak } from '../../lib/streaks'
import { periodGoal, periodProgress } from '../../lib/schedules'
import { isoToday } from '../../lib/dates'
import { cn, barBlocks } from '../../lib/utils'

interface Props {
  habit: Habit
  selected: boolean
  onSelect: () => void
}

export function HabitRow({ habit, selected, onSelect }: Props) {
  const ctx = useHabits()
  const { state, completeHabit, setValue, setOpenForm, archiveHabit } = ctx
  const today = isoToday()
  const done = isCompleted(habit, state.completions, today)
  const value = completionValue(habit, state.completions, today)
  const streak = calculateStreak(state, habit)
  const goal = periodGoal(habit)
  const isWeeklyLike = habit.schedule.type !== 'daily'
  const period = isWeeklyLike ? periodProgress(habit, state.completions, today) : null

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group flex items-center gap-2 sm:gap-3 px-2.5 py-2.5 sm:py-2 border rounded-sm cursor-pointer transition-colors min-w-0',
        selected
          ? 'border-accent bg-accent/10'
          : 'border-border bg-panel hover:border-muted',
      )}
    >
      {/* checkbox / toggle */}
      {habit.mode === 'checkbox' && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            completeHabit(habit)
          }}
          className={cn(
            'text-sm font-bold w-8 shrink-0 transition-colors',
            done ? 'text-accent' : 'text-muted group-hover:text-dim',
          )}
          aria-label={done ? 'uncomplete' : 'complete'}
        >
          [{done ? '✓' : ' '}]
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className={cn(
              'text-sm truncate',
              done ? 'text-dim line-through decoration-accent/50' : 'text-fg',
            )}
          >
            {habit.name}
          </span>
          {period && (
            <span className="text-[10px] text-warn tnum">
              [w {period.done}/{period.goal}]
            </span>
          )}
          {habit.unit && habit.mode !== 'checkbox' && (
            <span className="text-[10px] text-dim">{habit.unit}</span>
          )}
        </div>

        {/* mode-specific controls */}
        <div className="mt-1 flex items-center gap-2">
          {habit.mode === 'counter' && (
            <CounterControl habit={habit} value={value} onChange={(v) => setValue(habit, v)} />
          )}
          {habit.mode === 'number' && (
            <NumberControl habit={habit} value={value} onChange={(v) => setValue(habit, v)} />
          )}
          {habit.mode === 'timer' && <TimerControl habit={habit} />}

          {(habit.mode === 'number' || habit.mode === 'counter') && goal > 1 && (
            <span className="text-[10px] text-muted ml-auto tnum">
              {barBlocks(Math.min(100, (value / (habit.goal ?? 1)) * 100), 6)}
            </span>
          )}
        </div>
      </div>

      {/* streak */}
      <div className="text-right shrink-0">
        <div
          className={cn(
            'text-xs tnum font-bold',
            streak.streak > 0 ? 'text-accent' : 'text-muted',
          )}
          title={streak.shielded ? 'streak survived via shield' : 'current streak'}
        >
          {streak.streak > 0 ? `${streak.streak}d` : '—'}
          {streak.shielded && <span className="text-warn"> ◆</span>}
        </div>
        {!done && habit.mode === 'checkbox' && (
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 justify-end mt-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOpenForm(habit)
              }}
              className="text-[10px] text-dim hover:text-accent"
              title="edit (e)"
            >
              edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                archiveHabit(habit.id)
              }}
              className="text-[10px] text-dim hover:text-warn"
              title="archive"
            >
              arch
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CounterControl({
  habit,
  value,
  onChange,
}: {
  habit: Habit
  value: number
  onChange: (v: number) => void
}) {
  const goal = habit.goal ?? 0
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : value > 0 ? 100 : 0
  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="p-0.5 border border-border rounded-sm text-dim hover:text-danger hover:border-danger"
        aria-label="decrease"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="text-[11px] tnum min-w-[52px] text-center">
        <span className={value >= goal && goal > 0 ? 'text-accent font-bold' : 'text-fg'}>
          {value}
        </span>
        <span className="text-muted">/{goal}</span>
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className="p-0.5 border border-border rounded-sm text-dim hover:text-accent hover:border-accent"
        aria-label="increase"
      >
        <Plus className="w-3 h-3" />
      </button>
      <span className="text-[10px] text-muted ml-1 tnum hidden sm:inline">
        {barBlocks(pct, 6)}
      </span>
      <button
        onClick={() => onChange(goal)}
        className={cn(
          'text-[10px] px-1 border rounded-sm',
          value >= goal && goal > 0
            ? 'border-accent text-accent'
            : 'border-border text-dim hover:border-accent hover:text-accent',
        )}
        aria-label="fill goal"
      >
        max
      </button>
      <span className="sr-only">{habit.name}</span>
    </div>
  )
}

function NumberControl({ habit, value, onChange }: { habit: Habit; value: number; onChange: (v: number) => void }) {
  const goal = habit.goal ?? 0
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : value > 0 ? 100 : 0
  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="p-0.5 border border-border rounded-sm text-dim hover:text-danger hover:border-danger"
        aria-label="decrease"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="text-[11px] tnum min-w-[52px] text-center">
        <span className={value >= goal && goal > 0 ? 'text-accent font-bold' : 'text-fg'}>
          {value}
        </span>
        <span className="text-muted">/{goal}</span>
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className="p-0.5 border border-border rounded-sm text-dim hover:text-accent hover:border-accent"
        aria-label="increase"
      >
        <Plus className="w-3 h-3" />
      </button>
      <span className="text-[10px] text-muted ml-1 tnum hidden sm:inline">
        {barBlocks(pct, 6)}
      </span>
      <button
        onClick={() => onChange(goal)}
        className={cn(
          'text-[10px] px-1 border rounded-sm',
          value >= goal && goal > 0
            ? 'border-accent text-accent'
            : 'border-border text-dim hover:border-accent hover:text-accent',
        )}
        aria-label="fill goal"
      >
        max
      </button>
      <span className="sr-only">{habit.name}</span>
    </div>
  )
}

function TimerControl({ habit }: { habit: Habit }) {
  const timerCtx = useHabits()
  const { state, setValue } = timerCtx
  const today = isoToday()
  const value = completionValue(habit, state.completions, today)
  const target = habit.goal ?? 25
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [justFinished, setJustFinished] = useState(false)
  const startRef = useRef<number | null>(null)
  const valueRef = useRef(value)
  valueRef.current = value

  const notifyTimerDone = useCallback(() => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Habit Tracker', {
          body: `Timer "${habit.name}" selesai — ${target} menit`,
          silent: false,
          tag: `timer-${habit.id}-${today}`,
        })
      }
    } catch {}
  }, [habit.name, habit.id, target, today])

  const playSound = useCallback(
    async (src: string) => {
      try {
        const audio = new Audio(src)
        audio.volume = 0.5
        await audio.play()
      } catch {}
    },
    [],
  )

  useEffect(() => {
    if (!running) return
    startRef.current = Date.now()
    const id = setInterval(() => {
      const now = Date.now()
      const secs = Math.floor((now - (startRef.current ?? now)) / 1000)
      setElapsed(secs)
      const targetSecs = target * 60
      if (secs > 0 && secs >= targetSecs && !justFinished) {
        setRunning(false)
        setJustFinished(true)
        const newVal = valueRef.current + target
        setValue(habit, newVal)
        playSound('/favicon.ico')
        notifyTimerDone()
        setTimeout(() => setJustFinished(false), 3000)
      }
    }, 250)
    return () => {
      clearInterval(id)
      const secs = Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000)
      if (secs >= 1) {
        const mins = Math.floor(secs / 60)
        if (mins > 0 || secs >= 30) {
          setValue(habit, valueRef.current + Math.max(mins, secs >= 30 ? 1 : 0))
        }
      }
      setElapsed(0)
    }
  }, [running, habit, setValue, target, justFinished, playSound, notifyTimerDone])

  const launchTimer = () => {
    setRunning(true)
    playSound('/favicon.ico')
  }

  useEffect(() => {
    const ask = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    }
    ask()
  }, [habit.id])

  const totalSecs = value * 60 + elapsed
  const mm = String(Math.floor(totalSecs / 60)).padStart(2, '0')
  const ss = String(totalSecs % 60).padStart(2, '0')
  const pct = Math.min(100, (totalSecs / (target * 60)) * 100)

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={launchTimer}
        className={cn(
          'p-0.5 border rounded-sm',
          running
            ? 'border-warn text-warn'
            : 'border-border text-dim hover:text-accent hover:border-accent',
        )}
        aria-label={running ? 'pause' : 'start'}
      >
        {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <span className="text-[11px] tnum">
        <span className={pct >= 100 ? 'text-accent font-bold' : 'text-fg'}>
          {mm}:{ss}
        </span>
        <span className="text-muted"> / {target}:00</span>
      </span>
      {justFinished && (
        <span className="text-[10px] text-warn animate-pulse">✦ done</span>
      )}
      <span className="text-[10px] text-muted tnum">{barBlocks(pct, 6)}</span>
      <button
        onClick={() => {
          setRunning(false)
          setValue(habit, Math.min(value, target))
        }}
        className="p-0.5 border border-border rounded-sm text-dim hover:text-success hover:border-success"
        aria-label="stop and log"
      >
        <Square className="w-3 h-3" />
      </button>
    </div>
  )
}
