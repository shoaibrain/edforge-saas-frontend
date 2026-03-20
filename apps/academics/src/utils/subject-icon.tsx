/**
 * Subject Icon Mapping
 *
 * Returns a Lucide icon component based on subject area string.
 * Used for classroom card banner overlays and list view accents.
 */

import type { LucideIcon } from 'lucide-react'
import {
  Atom,
  Leaf,
  Sigma,
  Palette,
  BookOpen,
  Landmark,
  Wrench,
  Dumbbell,
  LayoutGrid,
} from 'lucide-react'

const SUBJECT_ICON_MAP: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /chem/i, icon: Atom },
  { match: /bio/i, icon: Leaf },
  { match: /math|algebra|calculus|geometry/i, icon: Sigma },
  { match: /art|studio|music|drama/i, icon: Palette },
  { match: /english|ela|literature/i, icon: BookOpen },
  { match: /history|social/i, icon: Landmark },
  { match: /voc|auto|tech/i, icon: Wrench },
  { match: /pe|physical/i, icon: Dumbbell },
]

export function getSubjectIcon(subjectArea?: string): LucideIcon {
  if (!subjectArea) return LayoutGrid
  const lower = subjectArea.toLowerCase()
  for (const entry of SUBJECT_ICON_MAP) {
    if (entry.match.test(lower)) return entry.icon
  }
  return LayoutGrid
}

/**
 * V2 capacity bar color based on fill percentage.
 * <33% green, 33-66% orange, >66% red.
 */
export function getCapacityColorV2(current: number, max: number): string {
  if (max <= 0) return '#1D9E75'
  const pct = (current / max) * 100
  if (pct < 33) return '#1D9E75'
  if (pct <= 66) return '#EF9F27'
  return '#E24B4A'
}
