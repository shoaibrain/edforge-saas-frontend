interface SectionTransitionProps {
  from: string
  to: string
  height?: string
}

export function SectionTransition({ from, to, height = 'clamp(3rem, 6vw, 6rem)' }: SectionTransitionProps) {
  return (
    <div
      className="w-full pointer-events-none"
      aria-hidden="true"
      style={{
        height,
        background: `linear-gradient(to bottom, ${from}, ${to})`,
      }}
    />
  )
}
