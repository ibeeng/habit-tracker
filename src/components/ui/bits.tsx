import { cn } from '../../lib/utils'
import { useAuth } from '../../store/auth'

/** ASCII-style bar: ███░░░░ 60% */
export function AsciiBar({ pct, width = 12 }: { pct: number; width?: number }) {
  const filled = Math.max(0, Math.min(width, Math.round((pct / 100) * width)))
  return (
    <span className="tnum tracking-tight" aria-hidden>
      <span className="text-accent">{'█'.repeat(filled)}</span>
      <span className="text-muted">{'░'.repeat(width - filled)}</span>
    </span>
  )
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full bg-heat0 rounded-full overflow-hidden border border-border">
      <div
        className="h-full bg-accent transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  )
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('border border-border bg-panel rounded-sm p-3', className)}>{children}</div>
  )
}

export function PromptLine({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const who = user
    ? (user.email?.split('@')[0] || user.name.split(' ')[0] || 'user').toLowerCase()
    : 'you'
  return (
    <div className="text-xs text-dim">
      <span className="text-accent" title={user?.email || undefined}>
        {who}@rootine
      </span>
      <span className="text-accent2"> $ </span>
      {children}
    </div>
  )
}
