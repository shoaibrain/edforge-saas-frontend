import type { ReactNode } from 'react'
import { CoreVisual } from './CoreVisual'
import { AnalyticsVisual } from './AnalyticsVisual'
import { FinanceVisual } from './FinanceVisual'
import { ChatVisual } from './ChatVisual'
import { CalendarVisual } from './CalendarVisual'
import { ApiVisual } from './ApiVisual'
import type { PillarCardPalette } from '../PillarCard'

export type PillarVisualId = 'core' | 'analytics' | 'finance' | 'chat' | 'calendar' | 'api'

/**
 * Per-pillar palette + visual mapping. Colors mirror the original design's
 * bento rhythm (warm peach, mint, gold, periwinkle, lavender, rose) — they
 * are deliberately NOT constrained to Breeze. Each card is a self-contained
 * visual island, so varied hues here do not pollute the landing surface
 * tokens.
 */
export const PILLAR_VISUALS: Record<
  PillarVisualId,
  {
    palette: PillarCardPalette
    render: (palette: PillarCardPalette) => ReactNode
  }
> = {
  core: {
    palette: { bg: '#FADBC8', ink: '#8A3E1A', accent: '#F47E3E' },
    render: (p) => <CoreVisual accent={p.accent} ink={p.ink} />,
  },
  analytics: {
    palette: { bg: '#D4EDE6', ink: '#0C4A46', accent: '#0F766E' },
    render: (p) => <AnalyticsVisual accent={p.accent} ink={p.ink} />,
  },
  finance: {
    palette: { bg: '#FFE9A8', ink: '#7A5210', accent: '#D98E04' },
    render: (p) => <FinanceVisual accent={p.accent} ink={p.ink} />,
  },
  chat: {
    palette: { bg: '#D9E5FF', ink: '#1D3A7A', accent: '#3D6BE0' },
    render: (p) => <ChatVisual accent={p.accent} ink={p.ink} />,
  },
  calendar: {
    palette: { bg: '#EADCFF', ink: '#4C2D87', accent: '#7C4DCC' },
    render: (p) => <CalendarVisual accent={p.accent} ink={p.ink} />,
  },
  api: {
    palette: { bg: '#FFD7D7', ink: '#7A1F1F', accent: '#D24747' },
    render: (p) => <ApiVisual accent={p.accent} ink={p.ink} />,
  },
}
