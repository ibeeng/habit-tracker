import { useEffect } from 'react'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { KeyboardHelp } from './components/layout/KeyboardHelp'
import { Toaster } from './components/layout/Toaster'
import { TodayView } from './components/today/TodayView'
import { HabitsView } from './components/habits/HabitsView'
import { HabitForm } from './components/habits/HabitForm'
import { StatsView } from './components/stats/StatsView'
import { LoginScreen } from './components/auth/LoginScreen'
import { useHabits } from './store/useHabits'
import { useAuth } from './store/auth'

export default function App() {
  const { user } = useAuth()
  const {
    tab,
    setTab,
    openForm,
    setOpenForm,
    dueToday,
    selectedId,
    setSelectedId,
    completeHabit,
    state,
    setTheme,
    exportJson,
  } = useHabits()

  useEffect(() => {
    if (!user) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (typing || openForm) return

      const idx = dueToday.findIndex((h) => h.id === selectedId)

      switch (e.key) {
        case '1':
        case 't':
          setTab('today')
          break
        case '2':
        case 's':
          setTab('stats')
          break
        case '3':
        case 'h':
          setTab('habits')
          break
        case 'j':
        case 'ArrowDown': {
          e.preventDefault()
          const next =
            dueToday[Math.min(Math.max(dueToday.length - 1, 0), idx + 1)] ?? dueToday[0]
          setSelectedId(next?.id ?? null)
          break
        }
        case 'k':
        case 'ArrowUp': {
          e.preventDefault()
          const prev = dueToday[Math.max(0, idx - 1)] ?? dueToday[0]
          setSelectedId(prev?.id ?? null)
          break
        }
        case ' ':
        case 'Enter': {
          e.preventDefault()
          const habit = dueToday.find((h) => h.id === selectedId)
          if (habit) completeHabit(habit)
          break
        }
        case 'n':
          e.preventDefault()
          setOpenForm('new')
          break
        case 'e': {
          const habit = state.habits.find((h) => h.id === selectedId)
          if (habit) setOpenForm(habit)
          break
        }
        case '?':
          window.dispatchEvent(new CustomEvent('toggle-help'))
          break
        case 'Escape':
          setOpenForm(null)
          break
        case 'r': {
          const themes = [
            'matrix',
            'dracula',
            'nord',
            'tokyo-night',
            'catppuccin',
            'gruvbox',
            'one-dark',
            'monokai',
            'paper',
            'amber-crt',
          ]
          const i = themes.indexOf(state.settings.theme)
          setTheme(themes[(i + 1) % themes.length])
          break
        }
        case 'x': {
          const blob = new Blob([exportJson()], { type: 'application/json' })
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = `rootine-backup-${new Date().toISOString().slice(0, 10)}.json`
          a.click()
          URL.revokeObjectURL(a.href)
          break
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    user,
    dueToday,
    selectedId,
    setSelectedId,
    completeHabit,
    setTab,
    setOpenForm,
    openForm,
    state.habits,
    state.settings.theme,
    setTheme,
    exportJson,
  ])

  if (!user) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg text-fg font-mono overflow-x-clip">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-8 min-w-0">
        {tab === 'today' && <TodayView />}
        {tab === 'stats' && <StatsView />}
        {tab === 'habits' && <HabitsView />}
      </main>

      {/* desktop footer */}
      <footer className="hidden sm:block border-t border-border px-6 py-2 text-[11px] text-dim flex gap-x-4 gap-y-1 justify-between max-w-3xl mx-auto w-full">
        <span>
          <span className="text-accent">$</span> press{' '}
          <kbd className="px-1 border border-border rounded">?</kbd> for keys
        </span>
        <span className="tnum">
          {state.habits.filter((h) => !h.archived).length} habits · {state.xp} xp ·{' '}
          {state.shields} shields
        </span>
      </footer>

      <BottomNav />
      {openForm && <HabitForm />}
      <KeyboardHelp />
      <Toaster />
    </div>
  )
}
