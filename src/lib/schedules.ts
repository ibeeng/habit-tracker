import { fromISO, getDay, isBefore, isoToday, toISO } from './dates'
import type { Habit, Schedule } from './models'

function inDateRange(schedule: Schedule, date: string): boolean {
  if (schedule.startDate && isBefore(date, schedule.startDate)) return false
  if (schedule.endDate && isBefore(schedule.endDate, date)) return false
  return true
}

/** Is this habit supposed to run on the given date? */
export function isDueOn(habit: Habit, date: string): boolean {
  if (habit.archived) return false
  const schedule = habit.schedule
  if (!inDateRange(schedule, date)) return false
  const d = fromISO(date)

  switch (schedule.type) {
    case 'daily':
      if (schedule.weekdays?.length) return schedule.weekdays.includes(getDay(d))
      return true
    case 'weekly':
    case 'biweekly':
      if (schedule.weekdays?.length) return schedule.weekdays.includes(getDay(d))
      return true
    case 'monthly': {
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
      const dom = Math.min(schedule.dayOfMonth ?? 1, lastDay)
      return d.getDate() === dom
    }
  }
}

export function getDueHabits(habits: Habit[], date: string = isoToday()): Habit[] {
  return habits.filter((h) => isDueOn(h, date))
}

/** Which calendar period does this date belong to? */
export function periodKeyFor(habit: Habit, date: string): string {
  const d = fromISO(date)
  switch (habit.schedule.type) {
    case 'daily':
      return date
    case 'weekly': {
      const monday = new Date(d)
      const day = (monday.getDay() + 6) % 7
      monday.setDate(monday.getDate() - day)
      return toISO(monday)
    }
    case 'biweekly': {
      const base = new Date(habit.createdAt)
      const days = Math.floor((d.getTime() - base.getTime()) / 86_400_000)
      return `b${Math.floor(days / 14)}`
    }
    case 'monthly':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
}

export function periodGoal(habit: Habit): number {
  const weekly = habit.schedule.timesPerWeek ?? 1
  switch (habit.schedule.type) {
    case 'daily':
      return 1
    case 'weekly':
      return weekly
    case 'biweekly':
      return weekly * 2
    case 'monthly':
      return 1
  }
}

/** Completions count in the current period → display as [w 2/3] */
export function periodProgress(
  habit: Habit,
  completions: Record<string, { habitId: string; date: string; value: number }>,
  date: string = isoToday(),
): { done: number; goal: number } {
  const goal = periodGoal(habit)
  if (habit.schedule.type === 'daily') {
    const key = habit.id + ':' + date
    void key
    return { done: 1, goal: 1 }
  }

  const key = periodKeyFor(habit, date)
  let done = 0
  for (const c of Object.values(completions)) {
    if (c.habitId !== habit.id) continue
    if (periodKeyFor(habit, c.date) === key && c.value > 0) done++
  }
  return { done: Math.min(done, goal), goal }
}
