import type { ReactNode } from 'react'

export interface BdiProps {
  children: ReactNode
  /**
   * Direction of the isolated run. Defaults to `'ltr'` for the common case —
   * identifiers, codes, numbers, dates, currency, and mixed format strings that
   * must not be reordered by the Unicode bidi algorithm inside RTL (Arabic)
   * content. Use `'auto'` when the run's direction depends on user data.
   */
  dir?: 'ltr' | 'rtl' | 'auto'
  className?: string
}

/**
 * Bdi — bidirectional isolation atom.
 *
 * Wraps an inline LTR "island" (e.g. an IEMIS/EMIS code, invoice number,
 * account id, GPA, time range, or `{{a}} – {{b}}` format string) so the bidi
 * algorithm isolates it from the surrounding RTL text. Without isolation,
 * trailing punctuation, parentheses, slashes, and numeric ranges visibly
 * reorder when the platform renders in Arabic.
 *
 * Renders a native `<bdi>` element (which carries `unicode-bidi: isolate` by
 * default); the explicit `dir` makes the intended direction unambiguous. In
 * LTR locales this is a visual no-op, so it is always safe to add.
 */
export function Bdi({ children, dir = 'ltr', className }: BdiProps) {
  return (
    <bdi dir={dir} className={className}>
      {children}
    </bdi>
  )
}
