/**
 * Hairline — single-pixel horizontal divider sitting between sections.
 * Mirrors the design's `.hairline` class.
 */
export function Hairline() {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className="bg-[var(--lp-border)]"
      style={{ height: 1 }}
    />
  )
}
