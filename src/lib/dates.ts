import {
  addDays,
  addMonths,
  format,
  getDay,
  getDate,
  isAfter,
  isBefore,
  isEqual,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'

export {
  addDays,
  addMonths,
  format,
  getDay,
  getDate,
  isAfter,
  isBefore,
  isEqual,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
}

export function today(): Date {
  return startOfDay(new Date())
}

export function toISO(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function fromISO(s: string): Date {
  return startOfDay(parseISO(s))
}

export function isoToday(): string {
  return toISO(today())
}

export function weekdayIndex(d: Date): number {
  return getDay(d)
}

/** Monday-based week key e.g. "2026-W38" — actually use ISO week-ish: monday date */
export function weekStart(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 })
}

export function monthStart(d: Date): Date {
  return startOfMonth(d)
}

export function formatDate(d: Date | string, pattern: string): string {
  const date = typeof d === 'string' ? parseISO(d) : d
  return format(date, pattern)
}

export function isPast(date: string, ref: string = isoToday()): boolean {
  return isBefore(fromISO(date), fromISO(ref))
}

export function isFuture(date: string, ref: string = isoToday()): boolean {
  return isAfter(fromISO(date), fromISO(ref))
}

export function daysBetween(a: string, b: string): number {
  const ms = fromISO(b).getTime() - fromISO(a).getTime()
  return Math.round(ms / 86_400_000)
}
