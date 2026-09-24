import type { AppState, Routine } from './models'
import { normalizeRoutineIcon } from './routine-icons'

const STORAGE_KEY = 'init-habits:v1'

export function defaultState(): AppState {
  return {
    habits: [],
    completions: {},
    routines: [],
    shields: 2,
    shieldEvents: [],
    xp: 0,
    unlockedAchievements: [],
    settings: { theme: 'matrix' },
  }
}

/** Migrate routines: missing icon, or legacy emoji → lucide key */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    const migrated = {
      ...defaultState(),
      ...parsed,
      settings: { ...defaultState().settings, ...parsed.settings },
      routines: (parsed.routines ?? defaultState().routines).map((r: Routine) => ({
        ...r,
        icon: normalizeRoutineIcon(
          typeof r.icon === 'string' ? r.icon : undefined,
          r.name,
        ),
      })),
    }
    return migrated as AppState
  } catch {
    return defaultState()
  }
}


export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('failed to save state', e)
  }
}

export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

export function parseImport(json: string): AppState {
  const parsed = JSON.parse(json) as Partial<AppState>
  if (!parsed || !Array.isArray(parsed.habits)) throw new Error('invalid backup file')
  return { ...defaultState(), ...parsed, settings: { ...defaultState().settings, ...parsed.settings } }
}
