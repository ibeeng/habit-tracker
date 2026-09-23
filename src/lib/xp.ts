import type { AppState } from './models'
import { totalCompletions } from './streaks'
import { maxStreak } from './streaks'

export const XP_PER_COMPLETION = 10

export interface LevelInfo {
  level: number
  xp: number
  intoLevel: number
  needForNext: number
  pct: number
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1
  let remaining = xp
  while (remaining >= 100 + (level - 1) * 50 && level < 99) {
    remaining -= 100 + (level - 1) * 50
    level++
  }
  const need = 100 + (level - 1) * 50
  return {
    level,
    xp,
    intoLevel: remaining,
    needForNext: need,
    pct: Math.min(100, Math.floor((remaining / need) * 100)),
  }
}

export interface Achievement {
  id: string
  name: string
  desc: string
  check: (state: AppState) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'init', name: 'init', desc: 'create your first habit', check: (s) => s.habits.length >= 1 },
  { id: 'first_run', name: 'first_run', desc: 'complete a habit', check: (s) => totalCompletions(s) >= 1 },
  { id: 'century', name: 'century', desc: '100 completions', check: (s) => totalCompletions(s) >= 100 },
  { id: 'uptime_7', name: 'uptime: 7d', desc: '7-day streak on any habit', check: (s) => maxStreak(s) >= 7 },
  { id: 'uptime_30', name: 'uptime: 30d', desc: '30-day streak on any habit', check: (s) => maxStreak(s) >= 30 },
  { id: 'uptime_100', name: 'uptime: 100d', desc: '100-day streak on any habit', check: (s) => maxStreak(s) >= 100 },
  { id: 'level_5', name: 'root access', desc: 'reach level 5', check: (s) => levelInfo(s.xp).level >= 5 },
  { id: 'level_10', name: 'kernel panic', desc: 'reach level 10', check: (s) => levelInfo(s.xp).level >= 10 },
  { id: 'shield_user', name: 'shielded', desc: 'hold a shield in stock', check: (s) => s.shields >= 1 },
  { id: 'routine', name: 'block_runner', desc: 'create a routine', check: (s) => s.routines.length >= 1 },
  {
    id: 'five_habits',
    name: 'multiplexer',
    desc: 'track 5 habits at once',
    check: (s) => s.habits.filter((h) => !h.archived).length >= 5,
  },
]

export function newlyUnlocked(state: AppState): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !state.unlockedAchievements.includes(a.id) && a.check(state))
}

export function grantAchievements(state: AppState): {
  state: AppState
  unlocked: Achievement[]
} {
  const fresh = newlyUnlocked(state)
  if (fresh.length === 0) return { state, unlocked: [] }
  return {
    state: {
      ...state,
      unlockedAchievements: [...state.unlockedAchievements, ...fresh.map((a) => a.id)],
    },
    unlocked: fresh,
  }
}
