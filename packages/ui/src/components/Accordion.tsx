import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { focusRing } from '../utils'

export type AccordionItem = {
  id: string
  trigger: ReactNode
  panel: ReactNode
}

export type AccordionProps = {
  items: ReadonlyArray<AccordionItem>
  /** Controlled open id. */
  openId?: string | null
  /** Uncontrolled default open id. */
  defaultOpenId?: string | null
  /** Fires when user opens/closes an item. Null means all closed. */
  onChange?: (openId: string | null) => void
  /** When true, multiple items can be open simultaneously. Default: single-open. */
  allowMultiple?: boolean
  /** Additional class for the outer container. */
  className?: string
  /** Color token for the +-button background. Defaults to landing primary. */
  iconColor?: string
  /** Color for the +-button in its open state. */
  iconColorOpen?: string
}

/**
 * Accordion — accessible single- or multi-expand disclosure pattern.
 *
 * Keyboard (per WAI-ARIA APG):
 *   Space / Enter        — toggle focused item
 *   ArrowDown / ArrowUp  — move focus between triggers with wrap-around
 *   Home / End           — jump to first / last trigger
 *
 * Semantics: each trigger is a `<button>` with aria-expanded + aria-controls.
 * Each panel is a `<div role="region">` with aria-labelledby. That pattern
 * is a disclosure-group; it is NOT a menu and does NOT trap Tab.
 */
export function Accordion({
  items,
  openId,
  defaultOpenId = null,
  onChange,
  allowMultiple = false,
  className,
  iconColor = 'var(--lp-primary, #E63946)',
  iconColorOpen = 'var(--lp-primary-ink, #7A1C26)',
}: AccordionProps) {
  const idPrefix = useId()
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([])
  const isControlled = openId !== undefined

  // Internal state backs both the single-open (single id) and
  // multi-open (set of ids) cases.
  const [internalSingle, setInternalSingle] = useState<string | null>(defaultOpenId)
  const [internalMulti, setInternalMulti] = useState<Set<string>>(() =>
    defaultOpenId ? new Set([defaultOpenId]) : new Set()
  )

  const isOpen = useCallback(
    (id: string): boolean => {
      if (allowMultiple) return internalMulti.has(id)
      const effective = isControlled ? openId ?? null : internalSingle
      return effective === id
    },
    [allowMultiple, internalMulti, internalSingle, isControlled, openId]
  )

  const toggle = useCallback(
    (id: string) => {
      if (allowMultiple) {
        setInternalMulti((prev) => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
        return
      }
      const current = isControlled ? openId ?? null : internalSingle
      const nextValue = current === id ? null : id
      if (!isControlled) setInternalSingle(nextValue)
      onChange?.(nextValue)
    },
    [allowMultiple, internalSingle, isControlled, onChange, openId]
  )

  const focusIndex = (i: number) => {
    const max = items.length - 1
    const clamped = i < 0 ? max : i > max ? 0 : i
    buttonsRef.current[clamped]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        focusIndex(i + 1)
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        focusIndex(i - 1)
        break
      case 'Home':
        e.preventDefault()
        focusIndex(0)
        break
      case 'End':
        e.preventDefault()
        focusIndex(items.length - 1)
        break
      default:
        // Space / Enter are handled by the native button click.
        break
    }
  }

  return (
    <div className={className}>
      {items.map((item, i) => {
        const open = isOpen(item.id)
        const triggerId = `${idPrefix}-trigger-${item.id}`
        const panelId = `${idPrefix}-panel-${item.id}`
        return (
          <div
            key={item.id}
            style={{
              borderTop: i === 0 ? '1px solid var(--lp-border, #E8E1D4)' : 'none',
              borderBottom: '1px solid var(--lp-border, #E8E1D4)',
            }}
          >
            <h3 style={{ margin: 0 }}>
              <button
                ref={(el) => {
                  buttonsRef.current[i] = el
                }}
                id={triggerId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={focusRing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  width: '100%',
                  padding: '22px 0',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  font: 'inherit',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    fontSize: 17,
                    fontWeight: 500,
                    color: 'var(--lp-ink, #0F1A2E)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.4,
                  }}
                >
                  {item.trigger}
                </div>
                <div
                  aria-hidden
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    background: open ? iconColorOpen : iconColor,
                    color: '#fff',
                    fontSize: 20,
                    lineHeight: 1,
                    display: 'grid',
                    placeItems: 'center',
                    transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
                    transition:
                      'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  +
                </div>
              </button>
            </h3>
            <div
              role="region"
              id={panelId}
              aria-labelledby={triggerId}
              hidden={!open}
              style={{
                maxHeight: open ? 400 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div
                style={{
                  padding: '0 60px 22px 0',
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: 'var(--lp-ink-3, #3B4862)',
                }}
              >
                {item.panel}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
