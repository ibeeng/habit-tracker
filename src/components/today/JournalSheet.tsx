import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, NotebookPen, Trash2, X } from 'lucide-react'
import { useHabits } from '../../store/useHabits'
import { journalNote, type Habit } from '../../lib/models'
import { formatDate, isoToday } from '../../lib/dates'
import { cn } from '../../lib/utils'

interface Props {
  habit: Habit
  onClose: () => void
}

/**
 * Journal editor for one habit on one day (`journalDate`, defaults to today).
 * Text is held locally while typing and committed with saveJournal() on
 * "save" / Ctrl+Enter / explicit close, so the note is written to
 * localStorage exactly once per commit. Switching days reloads the saved
 * entry for that day and discards nothing that was already committed.
 */
export function JournalSheet({ habit, onClose }: Props) {
  const { state, saveJournal, journalDate, setJournalDate } = useHabits()
  const day = journalDate || isoToday()
  const saved = journalNote(habit, state.completions, day)
  const [text, setText] = useState(saved)
  const [dirty, setDirty] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    el.selectionStart = el.selectionEnd = el.value.length
  }, [])

  // reload text when the edited day changes
  useEffect(() => {
    setText(saved)
    setDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, habit.id])

  /** save pending text for the current day, then jump to another day */
  const goTo = (iso: string) => {
    if (dirty) saveJournal(habit, text, day)
    setDirty(false)
    setJournalDate(iso)
  }

  const shiftDay = (delta: number) => {
    const [y, m, d] = day.split('-').map(Number)
    const next = new Date(y, m - 1, d + delta)
    const iso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
    if (iso > isoToday()) return
    goTo(iso)
  }

  const commit = () => {
    if (dirty) saveJournal(habit, text, day)
    onClose()
  }

  const clear = () => {
    setText('')
    setDirty(true)
    ref.current?.focus()
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div
      className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 fade-in"
      onClick={commit}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-panel border border-border rounded-t-md sm:rounded-md w-full sm:max-w-lg shadow-2xl flex flex-col fade-in"
        style={{ maxHeight: '92dvh' }}
      >
        {/* header */}
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3 border-b border-border shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-accent font-bold text-sm">
              <NotebookPen className="w-4 h-4 shrink-0" />
              <span className="truncate">{habit.name}</span>
              <span className="cursor-blink">_</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <button
                type="button"
                onClick={() => shiftDay(-1)}
                className="p-0.5 text-dim hover:text-accent"
                aria-label="previous day"
                title="previous day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-dim tnum">
                {formatDate(day, 'EEE, MMM d yyyy')}
                {day === isoToday() && <span className="text-accent"> · today</span>}
              </span>
              <button
                type="button"
                onClick={() => shiftDay(1)}
                disabled={day >= isoToday()}
                className={cn(
                  'p-0.5',
                  day >= isoToday() ? 'text-muted/40 cursor-not-allowed' : 'text-dim hover:text-accent',
                )}
                aria-label="next day"
                title="next day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {day !== isoToday() && (
                <button
                  type="button"
                  onClick={() => goTo(isoToday())}
                  className="ml-1 text-[10px] text-accent underline underline-offset-2 hover:opacity-80"
                >
                  back to today
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-dim hover:text-fg p-1 -m-1 shrink-0"
            aria-label="close journal"
            title="close (esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* editor */}
        <div className="px-4 py-3 overflow-y-auto overscroll-contain flex-1 min-h-0">
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setDirty(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                commit()
              }
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                commit()
              }
            }}
            placeholder={'// how was today?\n\nwrite anything — it is saved on this device'}
            spellCheck
            className="w-full min-h-[38dvh] sm:min-h-[44dvh] bg-bg2 border border-border rounded-sm px-3 py-2.5 text-base sm:text-sm text-fg placeholder:text-muted focus:outline-none focus:border-accent resize-none leading-relaxed"
          />
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted">
            <span className="tnum">
              {words} words · {text.length} chars
            </span>
            <span className="hidden sm:inline">ctrl+enter save · esc close</span>
          </div>
        </div>

        {/* actions */}
        <div
          className="flex items-center gap-2 border-t border-border px-4 py-3 shrink-0 justify-between"
          style={{ paddingBottom: 'max(0.75rem, var(--sab))' }}
        >
          <button
            type="button"
            onClick={clear}
            disabled={!text && !saved}
            className={cn(
              'flex items-center gap-1.5 text-xs px-2.5 py-1.5 border rounded-sm transition-colors',
              text || saved
                ? 'border-border text-dim hover:text-danger hover:border-danger'
                : 'border-border/50 text-muted/50 cursor-not-allowed',
            )}
            title={day === isoToday() ? "clear today's entry" : 'clear this entry'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            clear
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs border border-border rounded-sm text-dim hover:text-fg"
            >
              cancel
            </button>
            <button
              type="button"
              onClick={commit}
              disabled={!dirty}
              className={cn(
                'px-3 py-1.5 text-xs rounded-sm font-bold transition-colors',
                dirty
                  ? 'bg-accent text-bg hover:opacity-90'
                  : 'bg-accent/30 text-bg/60 cursor-not-allowed',
              )}
            >
              save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
