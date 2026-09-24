import { useState } from 'react'
import { Moon, Sun, Download, Upload, Plus, Sprout, MoreVertical, LogOut } from 'lucide-react'
import { useHabits, type Tab } from '../../store/useHabits'
import { useAuth } from '../../store/auth'
import { THEMES } from '../../themes'
import { levelInfo } from '../../lib/xp'
import { isoToday, formatDate } from '../../lib/dates'
import { cn } from '../../lib/utils'

const TABS: { id: Tab; key: string; label: string }[] = [
  { id: 'today', key: '1', label: 'today' },
  { id: 'stats', key: '2', label: 'stats' },
  { id: 'habits', key: '3', label: 'all' },
]

export function Header() {
  const { tab, setTab, state, setTheme, setOpenForm, exportJson, importJson, resetAll } =
    useHabits()
  const { user, signOut } = useAuth()
  const [themeOpen, setThemeOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const lvl = levelInfo(state.xp)
  const isLight = state.settings.theme === 'paper'

  const onImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        importJson(await file.text())
      } catch {
        alert('invalid backup file')
      }
    }
    input.click()
    setMenuOpen(false)
  }

  const onExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `rootine-${isoToday()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg2/90 backdrop-blur">
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-2.5 flex items-center gap-2">
        {/* logo */}
        <div className="flex items-center gap-1.5 min-w-0 mr-auto">
          <Sprout className="w-4 h-4 text-accent shrink-0" />
          <span className="font-bold text-accent tracking-tight text-sm sm:text-base truncate">
            Rootine
          </span>
          {user && (
            <span
              className="hidden sm:inline text-[10px] text-dim truncate max-w-28"
              title={user.email || user.name}
            >
              @{user.name.split(' ')[0].toLowerCase()}
            </span>
          )}
        </div>

        {/* desktop tabs */}
        <nav className="hidden sm:flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-2.5 py-1 text-xs rounded-sm border transition-colors',
                tab === t.id
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-transparent text-dim hover:text-fg hover:border-border',
              )}
            >
              <span className="opacity-50 mr-1">{t.key}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden sm:inline text-[11px] text-dim tnum label-caps">
            lv {lvl.level} · {lvl.intoLevel}/{lvl.needForNext} xp
          </span>
          <span className="text-[11px] text-warn tnum" title="shields">
            ◆{state.shields}
          </span>

          {/* theme */}
          <div className="relative">
            <button
              onClick={() => {
                setThemeOpen((v) => !v)
                setMenuOpen(false)
              }}
              className="p-1.5 rounded-sm border border-border text-dim hover:text-accent hover:border-accent transition-colors"
              title="theme (r)"
              aria-label="theme"
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            {themeOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-panel border border-border rounded-sm p-1 min-w-[150px] fade-in shadow-lg">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id)
                        setThemeOpen(false)
                      }}
                      className={cn(
                        'w-full text-left px-2 py-1.5 text-xs rounded-sm hover:bg-bg2',
                        state.settings.theme === t.id ? 'text-accent' : 'text-dim hover:text-fg',
                      )}
                    >
                      {state.settings.theme === t.id ? '▸ ' : '  '}
                      {t.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* overflow menu (import/export/reset) */}
          <div className="relative">
            <button
              onClick={() => {
                setMenuOpen((v) => !v)
                setThemeOpen(false)
              }}
              className="p-1.5 rounded-sm border border-border text-dim hover:text-accent hover:border-accent transition-colors"
              aria-label="menu"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-panel border border-border rounded-sm p-1 min-w-[160px] fade-in shadow-lg">
                  <button
                    onClick={onImport}
                    className="w-full text-left px-2 py-1.5 text-xs rounded-sm text-dim hover:bg-bg2 hover:text-fg flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> import backup
                  </button>
                  <button
                    onClick={onExport}
                    className="w-full text-left px-2 py-1.5 text-xs rounded-sm text-dim hover:bg-bg2 hover:text-fg flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" /> export backup
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('reset ALL local data?')) resetAll()
                      setMenuOpen(false)
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs rounded-sm text-danger hover:bg-bg2 flex items-center gap-2"
                  >
                    reset data
                  </button>
                  <button
                    onClick={() => {
                      signOut()
                      setMenuOpen(false)
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs rounded-sm text-dim hover:bg-bg2 hover:text-fg flex items-center gap-2 border-t border-border mt-1 pt-2"
                    title={user?.email}
                  >
                    <LogOut className="w-3.5 h-3.5" /> sign out
                  </button>
                </div>
              </>
            )}
          </div>

          {/* desktop new habit */}
          <button
            onClick={() => setOpenForm('new')}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-sm bg-accent text-bg font-bold hover:opacity-90 transition-opacity"
            title="new habit (n)"
          >
            <Plus className="w-3.5 h-3.5" />
            habit
          </button>
        </div>
      </div>

      {/* date line */}
      <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-1.5 text-[11px] text-dim">
        <span className="truncate block">
          {formatDate(new Date(), 'EEE, MMM d yyyy')} ·{' '}
          <span className="text-accent tnum">
            {Math.floor((Date.now() - Date.parse(new Date().getFullYear() + '-01-01')) / 86400000) + 1}
          </span>
        </span>
      </div>
    </header>
  )
}
