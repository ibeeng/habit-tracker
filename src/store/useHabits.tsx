import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { isoToday } from '../lib/dates'
import type { AppState, Habit, Routine, TrackingMode, Schedule } from '../lib/models'
import { completionKey } from '../lib/models'
import { isDueOn, periodGoal } from '../lib/schedules'
import { exportState, loadState, parseImport, saveState } from '../lib/storage'
import { calculateStreak, reconcileShields } from '../lib/streaks'
import { XP_PER_COMPLETION, grantAchievements, type Achievement } from '../lib/xp'
import { applyTheme } from '../themes'

export type Tab = 'today' | 'stats' | 'habits'

export interface Toast {
  id: number
  text: string
  kind: 'info' | 'achievement'
}

interface HabitsContextValue {
  state: AppState
  tab: Tab
  setTab: (t: Tab) => void
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  toasts: Toast[]
  toast: (text: string, kind?: Toast['kind']) => void
  dueToday: Habit[]
  openForm: Habit | 'new' | null
  setOpenForm: (v: Habit | 'new' | null) => void
  setTheme: (id: string) => void
  completeHabit: (habit: Habit, delta?: number) => void
  setValue: (habit: Habit, value: number) => void
  addHabit: (input: HabitInput) => void
  updateHabit: (id: string, input: HabitInput) => void
  archiveHabit: (id: string) => void
  deleteHabit: (id: string) => void
  addRoutine: (input: RoutineInput) => string
  deleteRoutine: (id: string) => void
  exportJson: () => string
  importJson: (json: string) => void
  resetAll: () => void
}

export interface HabitInput {
  name: string
  mode: TrackingMode
  schedule: Schedule
  goal?: number
  unit?: string
  routineId?: string | null
}

export interface RoutineInput {
  name: string
  icon?: string
}

const HabitsContext = createContext<HabitsContextValue | null>(null)

let toastSeq = 0

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const [tab, setTab] = useState<Tab>('today')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [openForm, setOpenForm] = useState<Habit | 'new' | null>(null)
  const booted = useRef(false)

  // persist
  useEffect(() => {
    saveState(state)
  }, [state])

  // theme
  useEffect(() => {
    applyTheme(state.settings.theme)
  }, [state.settings.theme])

  // shield reconcile once on boot (after a frame so state is ready)
  useEffect(() => {
    if (booted.current) return
    booted.current = true
    setState((s) => reconcileShields(s))
  }, [])

  const toast = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    const id = ++toastSeq
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, kind === 'achievement' ? 5000 : 2500)
  }, [])

  const setStateWithAchievements = useCallback(
    (prev: AppState) => {
      const { state: next, unlocked } = grantAchievements(prev)
      for (const a of unlocked) {
        setTimeout(() => toast(`★ achievement unlocked: ${a.name}`, 'achievement'), 50)
        void (a as Achievement)
      }
      return next
    },
    [toast],
  )

  const dueToday = useMemo(() => {
    const today = isoToday()
    return state.habits.filter((h) => isDueOn(h, today))
  }, [state.habits])

  const completeHabit = useCallback(
    (habit: Habit, delta = 1) => {
      setState((prev) => {
        const today = isoToday()
        const key = completionKey(habit.id, today)
        const existing = prev.completions[key]?.value ?? 0

        let next: number
        if (habit.mode === 'checkbox') {
          next = existing >= 1 ? 0 : 1
        } else if (habit.mode === 'timer') {
          next = existing
        } else {
          const goal = habit.goal ?? 1
          next = Math.max(0, Math.min(goal > 0 ? goal * 2 : existing + delta, existing + delta))
          if (next === existing) return prev
        }

        // toggle off for checkbox
        const completions = { ...prev.completions }
        if (habit.mode === 'checkbox' && next === 0) {
          delete completions[key]
        } else {
          completions[key] = {
            habitId: habit.id,
            date: today,
            value: next,
            updatedAt: new Date().toISOString(),
          }
        }

        // xp only when newly completed
        const wasDone = existing > 0 && habit.mode !== 'checkbox' ? true : existing >= 1
        const nowDone = next > 0
        let xp = prev.xp
        if (!wasDone && nowDone) xp += XP_PER_COMPLETION
        if (wasDone && !nowDone) xp = Math.max(0, xp - XP_PER_COMPLETION)

        // shield earn: every 7 completions total → handled lightly: +1 per 20 xp milestones already covered by checks
        let shields = prev.shields
        const beforeLvl = Math.floor(prev.xp / 200)
        const afterLvl = Math.floor(xp / 200)
        if (afterLvl > beforeLvl) shields += 1

        return setStateWithAchievements({
          ...prev,
          completions,
          xp,
          shields,
        })
      })
    },
    [setStateWithAchievements],
  )

  const setValue = useCallback((habit: Habit, value: number) => {
    setState((prev) => {
      const today = isoToday()
      const key = completionKey(habit.id, today)
      const clamped = Math.max(0, value)
      const completions = { ...prev.completions }
      if (clamped === 0) {
        delete completions[key]
      } else {
        completions[key] = {
          habitId: habit.id,
          date: today,
          value: clamped,
          updatedAt: new Date().toISOString(),
        }
      }
      const wasDone = (prev.completions[key]?.value ?? 0) > 0
      const nowDone = clamped > 0 && (habit.goal ?? 0) > 0 ? clamped >= (habit.goal ?? 0) : clamped > 0
      let xp = prev.xp
      if (!wasDone && nowDone) xp += XP_PER_COMPLETION
      if (wasDone && !nowDone) xp = Math.max(0, xp - XP_PER_COMPLETION)
      return { ...prev, completions, xp }
    })
  }, [])

  const addHabit = useCallback(
    (input: HabitInput) => {
      setState((prev) => {
        const habit: Habit = {
          id: crypto.randomUUID(),
          name: input.name,
          mode: input.mode,
          schedule: input.schedule,
          goal: input.goal,
          unit: input.unit,
          routineId: input.routineId ?? null,
          createdAt: new Date().toISOString(),
        }
        return setStateWithAchievements({ ...prev, habits: [...prev.habits, habit] })
      })
      setOpenForm(null)
      toast(`[ok] habit "${input.name}" created`)
    },
    [setStateWithAchievements, toast],
  )

  const updateHabit = useCallback(
    (id: string, input: HabitInput) => {
      setState((prev) => ({
        ...prev,
        habits: prev.habits.map((h) =>
          h.id === id
            ? {
                ...h,
                name: input.name,
                mode: input.mode,
                schedule: input.schedule,
                goal: input.goal,
                unit: input.unit,
                routineId: input.routineId ?? null,
              }
            : h,
        ),
      }))
      setOpenForm(null)
      toast(`[ok] habit updated`)
    },
    [toast],
  )

  const archiveHabit = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        habits: prev.habits.map((h) => (h.id === id ? { ...h, archived: !h.archived } : h)),
      }))
    },
    [],
  )

  const deleteHabit = useCallback((id: string) => {
    setState((prev) => {
      const completions = Object.fromEntries(
        Object.entries(prev.completions).filter(([k]) => !k.startsWith(id + ':')),
      )
      return {
        ...prev,
        habits: prev.habits.filter((h) => h.id !== id),
        completions,
        shieldEvents: prev.shieldEvents.filter((e) => e.habitId !== id),
      }
    })
  }, [])

  const addRoutine = useCallback(
    (input: RoutineInput) => {
      const id = crypto.randomUUID()
      setState((prev) =>
        setStateWithAchievements({
          ...prev,
          routines: [...prev.routines, { id, name: input.name, icon: input.icon ?? '🎯' } as Routine],
        }),
      )
      return id
    },
    [setStateWithAchievements],
  )

  const deleteRoutine = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      routines: prev.routines.filter((r) => r.id !== id),
      habits: prev.habits.map((h) => (h.routineId === id ? { ...h, routineId: null } : h)),
    }))
  }, [])

  const setTheme = useCallback((id: string) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, theme: id } }))
  }, [])

  const exportJson = useCallback(() => exportState(state), [state])

  const importJson = useCallback(
    (json: string) => {
      const parsed = parseImport(json)
      setState(parsed)
      toast('[ok] backup imported')
    },
    [toast],
  )

  const resetAll = useCallback(() => {
    localStorage.removeItem('init-habits:v1')
    setState(loadState())
    toast('[ok] state reset')
  }, [toast])

  const value: HabitsContextValue = {
    state,
    tab,
    setTab,
    selectedId,
    setSelectedId,
    toasts,
    toast,
    dueToday,
    openForm,
    setOpenForm,
    setTheme,
    completeHabit,
    setValue,
    addHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
    addRoutine,
    deleteRoutine,
    exportJson,
    importJson,
    resetAll,
  }

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
}

export function useHabits(): HabitsContextValue {
  const ctx = useContext(HabitsContext)
  if (!ctx) throw new Error('useHabits outside provider')
  return ctx
}

/** Convenience: progress + streak for a habit on a date */
export function useHabitMeta(habit: Habit) {
  const { state } = useHabits()
  return useMemo(() => {
    const streak = calculateStreak(state, habit)
    const goal = periodGoal(habit)
    return { streak: streak.streak, shielded: streak.shielded, goal }
  }, [state, habit])
}
