export type TrackingMode = 'checkbox' | 'counter' | 'number' | 'timer'

export type ScheduleType = 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface Schedule {
  type: ScheduleType
  /** weekly: target completions per week (e.g. 3x/week) */
  timesPerWeek?: number
  /** restrict to specific weekdays (0=Sun..6=Sat); if omitted, any day counts */
  weekdays?: number[]
  /** monthly: day of month 1-31 */
  dayOfMonth?: number
  startDate?: string
  endDate?: string
}

export interface Habit {
  id: string
  name: string
  mode: TrackingMode
  schedule: Schedule
  /** counter: goal per day · number: target value · timer: target minutes */
  goal?: number
  unit?: string
  routineId?: string | null
  createdAt: string
  archived?: boolean
}

export interface Completion {
  habitId: string
  date: string
  value: number
  updatedAt: string
}

export interface Routine {
  id: string
  name: string
}

export interface ShieldEvent {
  habitId: string
  date: string
}

export interface Settings {
  theme: string
}

export interface AppState {
  habits: Habit[]
  /** key: `${habitId}:${date}` */
  completions: Record<string, Completion>
  routines: Routine[]
  shields: number
  shieldEvents: ShieldEvent[]
  xp: number
  unlockedAchievements: string[]
  settings: Settings
}

export function completionKey(habitId: string, date: string): string {
  return `${habitId}:${date}`
}

export function isCompleted(habit: Habit, completions: AppState['completions'], date: string): boolean {
  const c = completions[completionKey(habit.id, date)]
  if (!c) return false
  if (habit.mode === 'checkbox') return c.value >= 1
  const goal = habit.goal ?? 0
  if (habit.mode === 'timer' || habit.mode === 'counter' || habit.mode === 'number') {
    return goal > 0 ? c.value >= goal : c.value > 0
  }
  return c.value > 0
}

export function completionValue(
  habit: Habit,
  completions: AppState['completions'],
  date: string,
): number {
  return completions[completionKey(habit.id, date)]?.value ?? 0
}
