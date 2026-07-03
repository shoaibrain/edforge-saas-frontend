/**
 * Header Zone — the utilization-for-decision-making layer:
 * ⑧ AttentionCorner (page-scoped, severity-segmented signals in the header's
 *   top-left) + ⑨ SelectionContextBar (state-aware selection actions that
 *   morph the table toolbar in place).
 */

export {
  AttentionCorner,
  AttentionCornerPill,
  AttentionCornerShade,
  type AttentionCornerProps,
} from './AttentionCorner'
export {
  SelectionContextBar,
  type SelectionContextBarProps,
  type SelectionContextBarLabels,
  type SelectionAction,
} from './SelectionContextBar'
export { DEFAULT_SELECTION_LABELS } from './labels'
export {
  DEFAULT_ATTENTION_LABELS,
  type Signal,
  type SignalSeverity,
  type AttentionCornerLabels,
} from './Signal'
