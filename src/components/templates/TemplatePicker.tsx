import { X } from 'lucide-react'
import { useHabits } from '../../store/useHabits'
import { TEMPLATES } from '../../lib/templates'
import { RoutineIcon } from '../../lib/routine-icons'

export function TemplatePicker() {
  const { openTemplatePicker, setOpenTemplatePicker, applyTemplate } = useHabits()

  if (!openTemplatePicker) return null

  const close = () => setOpenTemplatePicker(false)

  return (
    <div
      className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain fade-in modal-open"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-panel border border-border rounded-md sm:rounded-sm w-full max-w-3xl shadow-2xl my-auto flex flex-col"
        style={{ maxHeight: 'min(92dvh, calc(100dvh - 1.5rem))' }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
          <h2 className="text-accent font-bold text-sm">
            $ habit-templates --browse
            <span className="cursor-blink">_</span>
          </h2>
          <button type="button" onClick={close} className="text-dim hover:text-fg p-1 -m-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="px-4 py-4 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <p className="text-xs text-dim mb-4">
            Pick a preset to instantly create routines + habits. You can edit or delete them
            later.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template.id)}
                className="text-left bg-bg2 border border-border rounded-sm p-3 hover:border-accent transition-colors group"
              >
                <div className="flex items-start gap-2 mb-2">
                  <RoutineIcon icon={template.icon} className="w-5 h-5 text-accent mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-fg group-hover:text-accent">
                      {template.name}
                    </h3>
                    <p className="text-xs text-dim mt-0.5 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted mt-2 pt-2 border-t border-border">
                  <span>
                    {template.habits.length} habit{template.habits.length !== 1 ? 's' : ''}
                  </span>
                  {template.routines.length > 0 && (
                    <>
                      <span>·</span>
                      <span>
                        {template.routines.length} routine{template.routines.length !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>

                {/* Preview habits */}
                <div className="mt-2 flex flex-col gap-1">
                  {template.habits.slice(0, 3).map((h, i) => (
                    <div key={i} className="text-[10px] text-muted flex items-center gap-1.5">
                      <span className="text-accent2">→</span>
                      <span className="truncate">{h.name}</span>
                      {h.goal && h.unit && (
                        <span className="text-dim shrink-0">
                          ({h.goal} {h.unit})
                        </span>
                      )}
                    </div>
                  ))}
                  {template.habits.length > 3 && (
                    <div className="text-[10px] text-muted">
                      + {template.habits.length - 3} more
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div
          className="flex gap-2 justify-end border-t border-border px-4 py-3 shrink-0"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={close}
            className="px-3 py-1.5 text-xs border border-border rounded-sm text-dim hover:text-fg"
          >
            close
          </button>
        </div>
      </div>
    </div>
  )
}
