import { useRef, useLayoutEffect, useMemo, useState } from 'react'
import { useHabits } from '../../store/useHabits'
import { calculateStreak, totalCompletions } from '../../lib/streaks'
import { isCompleted } from '../../lib/models'
import { isDueOn } from '../../lib/schedules'
import { ACHIEVEMENTS, levelInfo } from '../../lib/xp'
import {
  addDays,
  format,
  fromISO,
  isoToday,
  startOfMonth,
  toISO,
} from '../../lib/dates'
import { Panel, PromptLine, AsciiBar } from '../ui/bits'
import { cn } from '../../lib/utils'

const WEEKS = 26

/** Monday of the week containing d */
function mondayOf(d: Date): Date {
  const day = (d.getDay() + 6) % 7 // 0=Mon
  return addDays(d, -day)
}

interface HeatCell {
  date: string
  count: number
  future: boolean
  monthLabel: string | null
}

export function StatsView() {
  const { state } = useHabits()
  const today = isoToday()
  const lvl = levelInfo(state.xp)
  const active = state.habits.filter((h) => !h.archived)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  // Precompute completion counts by date once
  const countByDate = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of Object.values(state.completions)) {
      if (c.value > 0) m.set(c.date, (m.get(c.date) ?? 0) + 1)
    }
    return m
  }, [state.completions])

  // Heatmap: exactly WEEKS+1 columns ending on current week's Monday
  const heatmap = useMemo(() => {
    const now = new Date()
    const thisMonday = mondayOf(now)
    const startMonday = addDays(thisMonday, -WEEKS * 7)
    const todayISO = toISO(now)
    let lastMonth = -1

    const weeks: HeatCell[][] = []
    for (let w = 0; w <= WEEKS; w++) {
      const weekStart = addDays(startMonday, w * 7)
      const week: HeatCell[] = []
      for (let i = 0; i < 7; i++) {
        const d = addDays(weekStart, i)
        const iso = toISO(d)
        const m = d.getMonth()
        // label month only on the first week where that month appears (column top row-ish: use monday of week)
        let monthLabel: string | null = null
        if (i === 0) {
          if (m !== lastMonth) {
            monthLabel = format(d, 'MMM')
            lastMonth = m
          }
        }
        week.push({
          date: iso,
          count: countByDate.get(iso) ?? 0,
          future: iso > todayISO,
          monthLabel,
        })
      }
      weeks.push(week)
    }
    return weeks
  }, [countByDate, today])

  // Auto-scroll so the CURRENT week is fully visible (right-aligned) without user scrolling
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const scrollToEnd = () => {
      el.scrollLeft = el.scrollWidth
      setScrolled(true)
    }
    // wait a frame for layout/fonts
    const raf = requestAnimationFrame(scrollToEnd)
    // also once after paint for font metrics
    const t = setTimeout(scrollToEnd, 100)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [heatmap])

  const monthDays = useMemo(() => {
    const now = new Date()
    const first = startOfMonth(now)
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
    const pad = first.getDay()
    const cells: (string | null)[] = Array(pad).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(toISO(new Date(first.getFullYear(), first.getMonth(), d)))
    }
    return cells
  }, [today])

  const monthLabel = format(new Date(), 'MMMM yyyy')

  const rate30 = useMemo(() => {
    let due = 0
    let done = 0
    for (let i = 0; i < 30; i++) {
      const iso = toISO(addDays(new Date(), -i))
      for (const h of active) {
        if (fromISO(h.createdAt.slice(0, 10)) > fromISO(iso)) continue
        if (isDueOn(h, iso)) {
          due++
          if (isCompleted(h, state.completions, iso)) done++
        }
      }
    }
    return due > 0 ? Math.round((done / due) * 100) : 0
  }, [active, state.completions])

  return (
    <div className="space-y-4 sm:space-y-5">
      <Panel>
        <PromptLine>stats --replay</PromptLine>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Stat label="completions" value={String(totalCompletions(state))} />
          <Stat label="30d rate" value={`${rate30}%`} />
          <Stat label="level" value={String(lvl.level)} />
          <Stat label="shields" value={`◆ ${state.shields}`} />
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-dim border-t border-border pt-2 overflow-hidden">
          <span className="label-caps shrink-0">xp</span>
          <AsciiBar pct={lvl.pct} width={12} />
          <span className="tnum shrink-0">
            {lvl.intoLevel}/{lvl.needForNext}
          </span>
        </div>
      </Panel>

      {/* heatmap — right-aligned on current week, month labels above */}
      <Panel className="overflow-hidden">
        <div className="flex items-baseline justify-between mb-2 gap-2">
          <span className="label-caps">// last {WEEKS + 1} weeks</span>
          <span className="text-[10px] text-muted">swipe ←</span>
        </div>
        <div
          ref={scrollRef}
          className="overflow-x-auto overscroll-x-contain -mx-1 px-1 pb-1"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="min-w-max" data-scrolled={scrolled}>
            {/* month labels row */}
            <div className="flex gap-[2px] mb-1 pl-0">
              {heatmap.map((week, wi) => {
                const label = week.find((c) => c.monthLabel)?.monthLabel
                return (
                  <div key={wi} className="w-[11px] shrink-0 text-[8px] text-dim leading-none h-3">
                    {label ?? ''}
                  </div>
                )
              })}
            </div>
            {/* day columns: Mon→Sun */}
            <div className="flex gap-[2px]">
              {heatmap.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((cell) => (
                    <div
                      key={cell.date}
                      title={`${cell.date}: ${cell.count} completions`}
                      className={cn(
                        'w-[11px] h-[11px] rounded-[2px] border border-border/30',
                        heatClass(cell.count),
                        cell.date === today && 'ring-1 ring-accent ring-offset-0',
                        cell.future && 'opacity-25',
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
            {/* weekday labels */}
            <div className="flex gap-[2px] mt-1">
              {heatmap[0]?.map((_, i) => (
                <div key={i} className="w-[11px] shrink-0 text-center text-[8px] text-muted leading-none">
                  {i === 0 ? 'M' : i === 2 ? 'W' : i === 4 ? 'F' : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-dim">
          <span>less</span>
          <span className="w-[11px] h-[11px] rounded-[2px] bg-heat0 border border-border/30" />
          <span className="w-[11px] h-[11px] rounded-[2px] bg-heat1 border border-border/30" />
          <span className="w-[11px] h-[11px] rounded-[2px] bg-heat2 border border-border/30" />
          <span className="w-[11px] h-[11px] rounded-[2px] bg-heat3 border border-border/30" />
          <span className="w-[11px] h-[11px] rounded-[2px] bg-heat4 border border-border/30" />
          <span>more</span>
        </div>
      </Panel>

      {/* month calendar */}
      <Panel>
        <div className="label-caps mb-2">// {monthLabel}</div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted mb-1">
          {['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((iso, i) => {
            if (!iso) return <div key={`pad-${i}`} />
            const count = countByDate.get(iso) ?? 0
            const isToday = iso === today
            const future = fromISO(iso) > fromISO(today)
            return (
              <div
                key={iso}
                title={`${iso}: ${count}`}
                className={cn(
                  'aspect-square flex items-center justify-center text-[11px] tnum rounded-sm border min-h-8',
                  future
                    ? 'border-transparent text-muted/30'
                    : isToday
                      ? 'border-accent text-accent font-bold'
                      : count > 0
                        ? cn('border-border', heatClass(count), 'text-fg')
                        : 'border-border/50 text-dim',
                )}
              >
                {fromISO(iso).getDate()}
              </div>
            )
          })}
        </div>
      </Panel>

      {/* per habit */}
      <Panel>
        <div className="label-caps mb-2">// per-habit deep dive</div>
        <div className="space-y-2">
          {active.map((h) => {
            const streak = calculateStreak(state, h)
            const rate = habitRate(state, h)
            return (
              <div key={h.id} className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs text-fg flex-1 min-w-0 truncate">{h.name}</span>
                <span className="text-[11px] text-accent tnum w-10 text-right shrink-0">
                  {streak.streak}d
                </span>
                <div className="w-16 sm:w-24 shrink-0">
                  <AsciiBar pct={rate} width={6} />
                </div>
                <span className="text-[11px] text-dim tnum w-9 text-right shrink-0">{rate}%</span>
              </div>
            )
          })}
          {active.length === 0 && <p className="text-xs text-dim">{'// no habits yet'}</p>}
        </div>
      </Panel>

      {/* achievements */}
      <Panel>
        <div className="label-caps mb-2">
          // achievements ({state.unlockedAchievements.length}/{ACHIEVEMENTS.length})
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = state.unlockedAchievements.includes(a.id)
            return (
              <div
                key={a.id}
                className={cn(
                  'text-xs px-2 py-1.5 border rounded-sm flex items-start gap-2 min-w-0',
                  unlocked ? 'border-warn/60 bg-warn/5' : 'border-border opacity-50',
                )}
              >
                <span className={unlocked ? 'text-warn' : 'text-muted'}>★</span>
                <div className="min-w-0">
                  <div className={unlocked ? 'text-warn font-bold' : 'text-dim'}>{a.name}</div>
                  <div className="text-[10px] text-muted">{a.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-caps">{label}</div>
      <div className="text-accent tnum font-bold text-lg">{value}</div>
    </div>
  )
}

function heatClass(count: number): string {
  if (count <= 0) return 'bg-heat0'
  if (count === 1) return 'bg-heat1'
  if (count <= 3) return 'bg-heat2'
  if (count <= 5) return 'bg-heat3'
  return 'bg-heat4'
}

function habitRate(
  state: ReturnType<typeof useHabits>['state'],
  habit: { id: string; createdAt: string },
): number {
  let due = 0
  let done = 0
  const start = fromISO(isoToday())
  for (let i = 0; i < 30; i++) {
    const iso = toISO(addDays(start, -i))
    if (fromISO(iso) < fromISO(habit.createdAt.slice(0, 10))) continue
    const h = state.habits.find((x) => x.id === habit.id)
    if (!h || !isDueOn(h, iso)) continue
    due++
    const c = state.completions[`${habit.id}:${iso}`]
    if (c && c.value > 0) done++
  }
  return due > 0 ? Math.round((done / due) * 100) : 0
}
