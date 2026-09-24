import type { AppState, Routine } from './models'

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

const ROUTINE_ICONS: Record<string, string> = {
  // morning / wind-down
  pagi: '🌅',
  pagi2: '☀️',
  morning: '🌅',
  evening: '🌙',
  night: '🌙',
  tidur: '🛏️',
  tidur2: '😴',
  sleep: '😴',
  // movement
  olahraga: '💪',
  gym: '🏋️',
  walk: '🚶',
  jalan: '🚶',
  running: '🏃',
  lari: '🏃',
  yoga: '🧘',
  streching: '🤸',
  stretch: '🤸',
  // drinks / intake
  air: '💧',
  water: '💧',
  minum: '💧',
  coffee: '☕',
  kopi: '☕',
  tea: '🍵',
  teh: '🍵',
  suplemen: '💊',
  suplement: '💊',
  vitamin: '💊',
  // food
  makan: '🍽️',
  breakfast: '🥞',
  makan_pagi: '🥞',
  lunch: '🍜',
  makan_siang: '🍜',
  dinner: '🍲',
  makan_malam: '🍲',
  healthy: '🥗',
  // grooming
  mandi: '🚿',
  shower: '🚿',
  gigi: '🪥',
  brush: '🪥',
  skincare: '🧴',
  care: '🧴',
  // work / focus
  kerja: '💻',
  work: '💻',
  coding: '💻',
  belajar: '📚',
  study: '📚',
  baca: '📖',
  read: '📖',
  focus: '🎯',
  deep: '🧠',
  deep_work: '🧠',
  // habits / check
  journal: '📓',
  log: '📝',
  note: '📝',
  meditasi: '🧘',
  meditate: '🧘',
  gratitude: '🙏',
  ucapan: '🙏',
  // smoke / break habits
  rokok: '🚬',
  smoke: '🚬',
  // misc
  review: '🔍',
  plan: '📋',
  weekly: '📅',
  monthly: '📆',
  cek: '✅',
  check: '✅',
  habit: '🎯',
  routine: '🎯',
  default: '🎯',
}

function iconFor(name: string): string {
  const key = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  return ROUTINE_ICONS[key] ?? ROUTINE_ICONS.default
}

/** Migrate old routines that lack icon */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    const migrated = {
      ...defaultState(),
      ...parsed,
      settings: { ...defaultState().settings, ...parsed.settings },
      routines: (parsed.routines ?? defaultState().routines).map((r: Routine) =>
        'icon' in r && typeof (r as Routine & { icon?: unknown }).icon === 'string'
          ? r
          : { ...r, icon: iconFor(r.name) },
      ),
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
