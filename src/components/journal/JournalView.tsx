import { useMemo, useState } from 'react'
import { NotebookPen, PenLine, Plus, Search } from 'lucide-react'
import { useHabits } from '../../store/useHabits'
import { journalNote, type Habit } from '../../lib/models'
import { formatDate, fromISO, isoToday, subDays, toISO } from '../../lib/dates'
import { Panel, PromptLine } from '../ui/bits'
import { cn } from '../../lib/utils'

interface Entry {
  habit: Habit
  date: string
  text: string
  words: number
}

function countWords(text: string): number {
  const body = text.trim()
  return body ? body.split(/\s+/).length : 0
}

/** "today" / "yesterday" / "3 days ago" / "Mar 14" */
function relativeDay(date: string, today: string): string {
  const diff = Math.round(
    (fromISO(today).getTime() - fromISO(date).getTime()) / 86_400_000,
  )
  if (diff <= 0) return 'today'
  if (diff === 1) return 'yesterday'
  if (diff < 7) return `${diff} days ago`
  return formatDate(date, 'MMM d')
}

export function JournalView() {
  const { state, openJournal, openNewHabit } = useHabits()
  const today = isoToday()
  const [habitFilter, setHabitFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const journalHabits = useMemo(
    () => state.habits.filter((h) => h.mode === 'journal'),
    [state.habits],
  )

  const allEntries = useMemo(() => {
    const out: Entry[] = []
    for (const h of journalHabits) {
      for (const c of Object.values(state.completions)) {
        if (c.habitId !== h.id) continue
        const text = c.note ?? ''
        if (!text.trim()) continue
        out.push({ habit: h, date: c.date, text, words: countWords(text) })
      }
    }
    out.sort((a, b) =>
      a.date === b.date
        ? a.habit.name.localeCompare(b.habit.name)
        : a.date < b.date
          ? 1
          : -1,
    )
    return out
  }, [journalHabits, state.completions])

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allEntries.filter((e) => {
      if (habitFilter && e.habit.id !== habitFilter) return false
      if (q && !e.text.toLowerCase().includes(q) && !e.habit.name.toLowerCase().includes(q))
        return false
      return true
    })
  }, [allEntries, habitFilter, query])

  const groups = useMemo(() => {
    const m = new Map<string, Entry[]>()
    for (const e of entries) {
      const arr = m.get(e.date) ?? []
      arr.push(e)
      m.set(e.date, arr)
    }
    return [...m.entries()]
  }, [entries])

  const stats = useMemo(() => {
    const days = new Set(allEntries.map((e) => e.date))
    const words = allEntries.reduce((n, e) => n + e.words, 0)
    let streak = 0
    let cursor = days.has(today)
      ? today
      : days.has(toISO(subDays(fromISO(today), 1)))
        ? toISO(subDays(fromISO(today), 1))
        : null
    while (cursor && days.has(cursor)) {
      streak += 1
      cursor = toISO(subDays(fromISO(cursor), 1))
    }
    return { entries: allEntries.length, days: days.size, words, streak }
  }, [allEntries, today])

  const pending = journalHabits.filter(
    (h) => !journalNote(h, state.completions, today).trim(),
  )

  if (journalHabits.length === 0) {
    return (
      <Panel>
        <PromptLine>journal --log</PromptLine>
        <p className="mt-3 text-dim text-sm">
          {'// no journal habit yet. a journal habit writes one entry per day — '}
          <button
            onClick={() => openNewHabit('journal')}
            className="text-accent underline underline-offset-2 hover:opacity-80"
          >
            create one
          </button>
        </p>
        <p className="mt-2 text-[11px] text-muted">
          // atau set mode <span className="text-accent2">journal</span> di form habit biasa
        </p>
      </Panel>
    )
  }

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <PromptLine>journal --log</PromptLine>
          <button
            onClick={() => openNewHabit('journal')}
            className="flex items-center gap-1 text-xs text-accent2 hover:opacity-80"
            title="new journal habit"
          >
            <Plus className="w-3 h-3" /> new journal
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-border pt-3">
          <div>
            <div className="label-caps">entries</div>
            <div className="text-accent tnum font-bold">{stats.entries}</div>
          </div>
          <div>
            <div className="label-caps">days</div>
            <div className="text-accent tnum font-bold">{stats.days}</div>
          </div>
          <div>
            <div className="label-caps">words</div>
            <div className="text-fg tnum font-bold">{stats.words}</div>
          </div>
          <div>
            <div className="label-caps">streak</div>
            <div className="text-warn tnum font-bold">{stats.streak}d</div>
          </div>
        </div>

        {/* write shortcuts for today */}
        {pending.length > 0 && (
          <div className="mt-3 border-t border-border pt-3">
            <div className="label-caps">belum ditulis hari ini</div>
            <div className="mt-1.5 flex gap-1.5 flex-wrap">
              {pending.map((h) => (
                <button
                  key={h.id}
                  onClick={() => openJournal(h, today)}
                  className="flex items-center gap-1.5 px-2 py-1 border border-accent/50 text-accent text-xs rounded-sm hover:bg-accent/10 transition-colors"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  {h.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* filters */}
        <div className="mt-3 border-t border-border pt-3 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-bg2 border border-border rounded-sm px-2 py-0.5 flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="grep entries…"
              className="flex-1 min-w-0 bg-transparent text-xs text-fg placeholder:text-muted focus:outline-none py-0.5"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setHabitFilter(null)}
              className={cn(
                'px-2 py-1 border rounded-sm text-[10px]',
                habitFilter === null
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-dim hover:border-muted',
              )}
            >
              all
            </button>
            {journalHabits.map((h) => (
              <button
                key={h.id}
                onClick={() => setHabitFilter(habitFilter === h.id ? null : h.id)}
                title={h.name}
                className={cn(
                  'px-2 py-1 border rounded-sm text-[10px] max-w-[140px] truncate',
                  habitFilter === h.id
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-border text-dim hover:border-muted',
                )}
              >
                {h.name}
                {h.archived && ' (arch)'}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {entries.length === 0 ? (
        <Panel className="text-dim text-sm">
          {'// '}
          {allEntries.length === 0
            ? 'belum ada entri — tulis hari pertama di atas.'
            : 'no match for this filter.'}
        </Panel>
      ) : (
        <div className="space-y-3">
          {groups.map(([date, items]) => (
            <section key={date} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-xs font-bold text-accent2 uppercase tracking-widest">
                  {relativeDay(date, today)}
                </h2>
                <span className="text-[10px] text-muted tnum">
                  {formatDate(date, 'EEE, MMM d yyyy')} ·{' '}
                  {items.reduce((n, e) => n + e.words, 0)} words
                </span>
              </div>
              {items.map((e) => (
                <button
                  key={`${e.habit.id}:${date}`}
                  onClick={() => openJournal(e.habit, date)}
                  className="block w-full text-left border border-border bg-panel rounded-sm px-3 py-2 hover:border-accent/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-accent">
                    <NotebookPen className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-bold truncate">{e.habit.name}</span>
                    {e.habit.archived && (
                      <span className="text-muted">(archived)</span>
                    )}
                    <span className="ml-auto text-muted tnum shrink-0">
                      {e.words}w · {e.text.length}c
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-dim leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {e.text}
                  </p>
                </button>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
