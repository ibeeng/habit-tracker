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
import { normalizeRoutineIcon } from '../lib/routine-icons'
import { calculateStreak, reconcileShields } from '../lib/streaks'
import { XP_PER_COMPLETION, grantAchievements, type Achievement } from '../lib/xp'
import { applyTheme } from '../themes'
import { TEMPLATES } from '../lib/templates'

export type Tab = 'today' | 'stats' | 'habits' | 'journal'

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
  /** preset mode for the next new-habit form (from the journal tab) */
  formMode: TrackingMode | null
  /** open the habit form for a new habit, optionally with a preset mode */
  openNewHabit: (mode?: TrackingMode) => void
  openTemplatePicker: boolean
  setOpenTemplatePicker: (v: boolean) => void
  setTheme: (id: string) => void
  completeHabit: (habit: Habit, delta?: number) => void
  setValue: (habit: Habit, value: number) => void
  /** journal habits: save the written entry (empty text clears the day) */
  saveJournal: (habit: Habit, text: string, date?: string) => void
  /** currently open journal editor (null = closed) */
  journalId: string | null
  /** day being edited in the journal editor */
  journalDate: string
  openJournal: (habit: Habit, date?: string) => void
  closeJournal: () => void
  setJournalDate: (date: string) => void
  addHabit: (input: HabitInput) => void
  updateHabit: (id: string, input: HabitInput) => void
  archiveHabit: (id: string) => void
  deleteHabit: (id: string) => void
  addRoutine: (input: RoutineInput) => string
  deleteRoutine: (id: string) => void
  applyTemplate: (templateId: string) => void
  exportJson: () => string
  importJson: (json: string) => void
  applyRemoteState: (next: AppState) => void
  resetAll: () => void
}

export interface HabitInput {
  name: string
  mode: TrackingMode
  schedule: Schedule
  goal?: number
  unit?: string
  routineId?: string | null
  notes?: string
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
  const [formMode, setFormMode] = useState<TrackingMode | null>(null)
  const [openTemplatePicker, setOpenTemplatePicker] = useState(false)
  const [journalId, setJournalId] = useState<string | null>(null)
  const [journalDate, setJournalDate] = useState<string>(() => isoToday())
  const booted = useRef(false)

  // persist — debounced so rapid toggles don't serialise the whole state
  // on every keystroke (state grows with journal text)
  const saveTimer = useRef<number | null>(null)
  useEffect(() => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => saveState(state), 250)
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    }
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
      // journal habits are completed by writing text (saveJournal), not by
      // incrementing a counter — a bare value:1 would be a phantom completion
      if (habit.mode === 'journal') {
        setJournalId(habit.id)
        return
      }
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

  /**
   * Journal habits store the written entry in `completions[key].note`.
   * `value` stays at 1 so streak / xp / achievements / stats / heatmap logic
   * is untouched. Empty (or whitespace) text clears the entry and un-completes
   * the day. `date` defaults to today so past days can be written too.
   */
  const saveJournal = useCallback((habit: Habit, text: string, date?: string) => {
    const day = date ?? isoToday()
    setState((prev) => {
      const key = completionKey(habit.id, day)
      const body = text.trim()
      const completions = { ...prev.completions }

      if (!body) {
        if (!completions[key]) return prev
        delete completions[key]
        const xp = Math.max(0, prev.xp - XP_PER_COMPLETION)
        return { ...prev, completions, xp }
      }

      const wasDone = (prev.completions[key]?.value ?? 0) > 0
      completions[key] = {
        habitId: habit.id,
        date: day,
        value: 1,
        updatedAt: new Date().toISOString(),
        note: text,
      }
      const xp = wasDone ? prev.xp : prev.xp + XP_PER_COMPLETION
      return { ...prev, completions, xp }
    })
  }, [])

  const openJournal = useCallback((habit: Habit, date?: string) => {
    setJournalId(habit.id)
    setJournalDate(date ?? isoToday())
  }, [])
  const closeJournal = useCallback(() => setJournalId(null), [])

  const openNewHabit = useCallback((mode?: TrackingMode) => {
    setFormMode(mode ?? null)
    setOpenForm('new')
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
          notes: input.notes?.trim() || undefined,
          createdAt: new Date().toISOString(),
        }
        return setStateWithAchievements({ ...prev, habits: [...prev.habits, habit] })
      })
      setOpenForm(null)
      setFormMode(null)
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
                notes: input.notes?.trim() || undefined,
              }
            : h,
        ),
      }))
      setOpenForm(null)
      setFormMode(null)
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
          routines: [
            ...prev.routines,
            {
              id,
              name: input.name,
              icon: input.icon ?? normalizeRoutineIcon(undefined, input.name),
            } as Routine,
          ],
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

  const applyRemoteState = useCallback((next: AppState) => {
    setState(next)
  }, [])

  const resetAll = useCallback(() => {
    localStorage.removeItem('init-habits:v1')
    setState(loadState())
    toast('[ok] state reset')
  }, [toast])

  const applyTemplate = useCallback(
    (templateId: string) => {
      setState((prev) => {
        const template = TEMPLATES.find((t) => t.id === templateId)
        if (!template) return prev

        // Create routines first
        const routineMap = new Map<string, string>()
        const newRoutines: Routine[] = [...prev.routines]
        for (const r of template.routines) {
          const id = crypto.randomUUID()
          routineMap.set(r.ref, id)
          newRoutines.push({
            id,
            name: r.name,
            icon: normalizeRoutineIcon(r.icon, r.name),
          })
        }

        // Create habits
        const newHabits: Habit[] = [...prev.habits]
        for (const h of template.habits) {
          const habit: Habit = {
            id: crypto.randomUUID(),
            name: h.name,
            mode: h.mode,
            schedule: h.schedule,
            goal: h.goal,
            unit: h.unit,
            routineId: h.routineRef ? routineMap.get(h.routineRef) ?? null : null,
            notes: h.notes,
            createdAt: new Date().toISOString(),
          }
          newHabits.push(habit)
        }

        return setStateWithAchievements({
          ...prev,
          routines: newRoutines,
          habits: newHabits,
        })
      })
      setOpenTemplatePicker(false)
      toast(`[ok] template "${templateId}" applied`)
    },
    [setStateWithAchievements, toast],
  )

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
    formMode,
    openNewHabit,
    openTemplatePicker,
    setOpenTemplatePicker,
    setTheme,
    completeHabit,
    setValue,
    saveJournal,
    journalId,
    journalDate,
    openJournal,
    closeJournal,
    setJournalDate,
    addHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
    addRoutine,
    deleteRoutine,
    applyTemplate,
    exportJson,
    importJson,
    applyRemoteState,
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
