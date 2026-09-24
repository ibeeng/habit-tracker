import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const KEYS: [string, string][] = [
  ['j / k', 'move selection'],
  ['space / enter', 'toggle complete'],
  ['n', 'new habit'],
  ['e', 'edit selected habit'],
  ['1 / 2 / 3', 'today / stats / all habits'],
  ['t / s / h', 'same as above'],
  ['r', 'cycle theme'],
  ['x', 'export backup'],
  ['?', 'toggle this help'],
  ['esc', 'close modal'],
]

export function KeyboardHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const toggle = () => setOpen((v) => !v)
    window.addEventListener('toggle-help', toggle)
    return () => window.removeEventListener('toggle-help', toggle)
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 fade-in overflow-y-auto overscroll-contain modal-open"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-panel border border-border rounded-md sm:rounded-sm max-w-md w-full shadow-2xl flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: 'min(90dvh, calc(100dvh - 1.5rem))' }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
          <h2 className="text-accent font-bold text-sm">
            $ help --keys<span className="cursor-blink">_</span>
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-dim hover:text-fg p-1 -m-1"
            aria-label="close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div
          className="px-4 py-4 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <ul className="space-y-1.5">
            {KEYS.map(([k, desc]) => (
              <li key={k} className="flex items-baseline gap-3 text-xs">
                <kbd className="min-w-[110px] px-1.5 py-0.5 border border-border rounded-sm bg-bg2 text-accent text-center">
                  {k}
                </kbd>
                <span className="text-dim">// {desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-dim border-t border-border pt-3">
            [ok] keyboard module loaded
          </p>
        </div>
      </div>
    </div>
  )
}
