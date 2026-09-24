import { useState, useRef, useEffect, type TouchEvent, type MouseEvent } from 'react'
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react'
import { useHabits } from '../../store/useHabits'
import { calculateStreak } from '../../lib/streaks'
import { isCompleted, type Habit } from '../../lib/models'
import { isoToday } from '../../lib/dates'
import { RoutineIcon } from '../../lib/routine-icons'
import { cn } from '../../lib/utils'

interface SwipeableHabitRowProps {
  habit: Habit
  selected: boolean
  onSelect: () => void
}

export function SwipeableHabitRow({ habit, selected, onSelect }: SwipeableHabitRowProps) {
  const { state, setOpenForm, archiveHabit, deleteHabit } = useHabits()
  const today = isoToday()
  const streak = calculateStreak(state, habit)
  const doneToday = isCompleted(habit, state.completions, today)

  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const SWIPE_THRESHOLD = 80
  const MAX_SWIPE = 150

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX
    currentX.current = startX.current
    setIsDragging(true)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return
    currentX.current = e.touches[0].clientX
    const delta = currentX.current - startX.current
    // Only allow left swipe (negative offset)
    const newOffset = Math.max(Math.min(delta, 0), -MAX_SWIPE)
    setOffset(newOffset)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (offset < -SWIPE_THRESHOLD) {
      setOffset(-MAX_SWIPE) // snap open
    } else {
      setOffset(0) // snap closed
    }
  }

  // Mouse events for desktop testing
  const handleMouseDown = (e: MouseEvent) => {
    startX.current = e.clientX
    currentX.current = startX.current
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    currentX.current = e.clientX
    const delta = currentX.current - startX.current
    const newOffset = Math.max(Math.min(delta, 0), -MAX_SWIPE)
    setOffset(newOffset)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (offset < -SWIPE_THRESHOLD) {
      setOffset(-MAX_SWIPE)
    } else {
      setOffset(0)
    }
  }

  // Close swipe when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOffset(0)
      }
    }
    if (offset !== 0) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }
  }, [offset])

  const handleAction = (action: () => void) => {
    action()
    setOffset(0)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden border rounded-sm',
        selected ? 'border-accent bg-accent/10' : 'border-border bg-panel',
        habit.archived && 'opacity-50',
      )}
    >
      {/* Action buttons background (revealed on swipe) */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-1 px-2">
        <button
          onClick={() => handleAction(() => setOpenForm(habit))}
          className="w-10 h-10 flex items-center justify-center text-accent active:opacity-70"
          title="edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleAction(() => archiveHabit(habit.id))}
          className="w-10 h-10 flex items-center justify-center text-warn active:opacity-70"
          title={habit.archived ? 'restore' : 'archive'}
        >
          {habit.archived ? (
            <ArchiveRestore className="w-4 h-4" />
          ) : (
            <Archive className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() =>
            handleAction(() => {
              if (confirm(`delete "${habit.name}" and all its history?`)) deleteHabit(habit.id)
            })
          }
          className="w-10 h-10 flex items-center justify-center text-danger active:opacity-70"
          title="delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main content (swipeable) */}
      <div
        className={cn(
          'relative flex items-center gap-3 px-2.5 py-2 bg-panel cursor-pointer',
          isDragging ? '' : 'transition-transform duration-200 ease-out',
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => {
          // Only select if not swiped
          if (Math.abs(offset) < 10) {
            onSelect()
          }
        }}
      >
        <span
          className={cn('w-8 text-center text-sm font-bold', doneToday ? 'text-accent' : 'text-muted')}
        >
          [{doneToday ? '✓' : ' '}]
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-fg truncate">{habit.name}</div>
          <div className="text-[10px] text-dim flex gap-2 flex-wrap mt-0.5">
            <span className="text-accent2">{habit.mode}</span>
            <span>{habit.schedule.type}</span>
            {habit.goal != null && (
              <span className="tnum">
                goal {habit.goal}
                {habit.unit ? ` ${habit.unit}` : ''}
              </span>
            )}
            {habit.routineId &&
              (() => {
                const r = state.routines.find((x) => x.id === habit.routineId)
                return r ? (
                  <span className="text-warn inline-flex items-center gap-1">
                    <RoutineIcon icon={r.icon} className="w-4 h-4 text-warn" />
                    {r.name}
                  </span>
                ) : null
              })()}
          </div>
        </div>
        <div className="text-right text-xs tnum shrink-0">
          <div className={streak.streak > 0 ? 'text-accent font-bold' : 'text-muted'}>
            {streak.streak > 0 ? `${streak.streak}d` : '—'}
          </div>
          <div className="text-[9px] text-muted">streak</div>
        </div>
      </div>
    </div>
  )
}
