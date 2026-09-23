import { addDays, isBefore, toISO } from './dates'
import { isDueOn, periodGoal, periodKeyFor } from './schedules'
import type { AppState, Habit, ShieldEvent } from './models'
import { isCompleted } from './models'

function hasShield(state: AppState, habitId: string, date: string): boolean {
  return state.shieldEvents.some((e) => e.habitId === habitId && e.date === date)
}

export interface StreakResult {
  streak: number
  shielded: boolean
}

/**
 * Walk backwards from yesterday over scheduled days.
 * - completed → streak++
 * - shield-covered miss → continue (no break, no increment)
 * - raw miss → break
 * Weekly/biweekly/monthly count consecutive satisfied periods instead.
 */
export function calculateStreak(state: AppState, habit: Habit): StreakResult {
  if (habit.schedule.type !== 'daily') {
    return calculatePeriodStreak(state, habit)
  }

  let streak = 0
  let sawShield = false
  const start = new Date(habit.createdAt)
  let cursor = addDays(new Date(), -1)
  let steps = 0

  while (steps < 800) {
    steps++
    if (isBefore(cursor, start)) break
    const iso = toISO(cursor)
    if (!isDueOn(habit, iso)) {
      cursor = addDays(cursor, -1)
      continue
    }
    if (isCompleted(habit, state.completions, iso)) {
      streak++
      sawShield = false
    } else if (hasShield(state, habit.id, iso)) {
      sawShield = true
    } else {
      break
    }
    cursor = addDays(cursor, -1)
  }
  return { streak, shielded: streak > 0 && sawShield }
}

function completionsInPeriod(state: AppState, habit: Habit, key: string): number {
  let done = 0
  for (const c of Object.values(state.completions)) {
    if (c.habitId !== habit.id) continue
    if (periodKeyFor(habit, c.date) === key && c.value > 0) done++
  }
  return done
}

function calculatePeriodStreak(state: AppState, habit: Habit): StreakResult {
  let streak = 0
  let sawShield = false
  let cursor = new Date()
  const start = new Date(habit.createdAt)
  const goal = periodGoal(habit)
  let steps = 0

  while (steps < 260) {
    steps++
    if (isBefore(cursor, start)) break
    const key = periodKeyFor(habit, toISO(cursor))
    const done = completionsInPeriod(state, habit, key)
    const isCurrent = key === periodKeyFor(habit, toISO(new Date()))

    if (isCurrent) {
      if (done >= goal) {
        streak++
        sawShield = false
      }
      break
    }

    if (done >= goal) {
      streak++
      sawShield = false
    } else {
      const covered = state.shieldEvents.some(
        (e) => e.habitId === habit.id && periodKeyFor(habit, e.date) === key,
      )
      if (covered) {
        sawShield = true
      } else {
        break
      }
    }

    if (habit.schedule.type === 'monthly') {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 15)
    } else if (habit.schedule.type === 'biweekly') {
      cursor = addDays(cursor, -14)
    } else {
      cursor = addDays(cursor, -7)
    }
  }
  return { streak, shielded: streak > 0 && sawShield }
}

/** streak counting scheduled days strictly before `beforeDate` */
function streakEndingBefore(state: AppState, habit: Habit, beforeDate: string): number {
  let streak = 0
  let cursor = addDays(new Date(beforeDate), -1)
  const start = new Date(habit.createdAt)
  let steps = 0
  while (steps < 800) {
    steps++
    if (isBefore(cursor, start)) break
    const iso = toISO(cursor)
    if (!isDueOn(habit, iso)) {
      cursor = addDays(cursor, -1)
      continue
    }
    if (isCompleted(habit, state.completions, iso) || hasShield(state, habit.id, iso)) {
      streak++
      cursor = addDays(cursor, -1)
    } else {
      break
    }
  }
  return streak
}

/**
 * Auto-spend shields for the most recent raw miss of each habit,
 * but only when there was a streak worth protecting.
 */
export function reconcileShields(state: AppState): AppState {
  if (state.shields <= 0) return state
  let shieldEvents: ShieldEvent[] = [...state.shieldEvents]
  let shields = state.shields
  let changed = false

  for (const habit of state.habits) {
    if (habit.archived) continue
    if (shields <= 0) break

    let cursor = addDays(new Date(), -1)
    let checked = 0
    let target: string | null = null
    while (checked < 60) {
      checked++
      const iso = toISO(cursor)
      if (isBefore(cursor, new Date(habit.createdAt))) break
      if (isDueOn(habit, iso)) {
        if (!isCompleted(habit, state.completions, iso)) target = iso
        break
      }
      cursor = addDays(cursor, -1)
    }
    if (!target) continue
    if (shieldEvents.some((e) => e.habitId === habit.id && e.date === target)) continue

    const probe: AppState = { ...state, shieldEvents }
    if (streakEndingBefore(probe, habit, target) > 0) {
      shieldEvents = [...shieldEvents, { habitId: habit.id, date: target }]
      shields--
      changed = true
    }
  }

  if (!changed) return state
  return { ...state, shields, shieldEvents }
}

export function maxStreak(state: AppState): number {
  let max = 0
  for (const h of state.habits) {
    if (h.archived) continue
    max = Math.max(max, calculateStreak(state, h).streak)
  }
  return max
}

export function totalCompletions(state: AppState): number {
  return Object.keys(state.completions).length
}
