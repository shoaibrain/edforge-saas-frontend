/**
 * EdForge — Signature animated-icon system (@edforge/ui/motion).
 *
 * The CSS engine ships from @edforge/theme (icon-motion.css); this entry exports the
 * React surface: the AnimatedIcon wrapper, the glyph set, and the signature/accent
 * registry. Add a new MFE icon by calling `registerSignature(icon, name)` once.
 */
export { AnimatedIcon } from './AnimatedIcon';
export type { AnimatedIconProps, AnimatedIconHandle } from './AnimatedIcon';

export { EFIcon, ICON_PARTS, ICON_META } from './icons';
export type { IconName, EFIconProps } from './icons';

export {
  ICON_ACCENT,
  resolveAccent,
  nameForLucide,
  registerSignature,
} from './signatures';
export type { AccentHue, AccentMode, ResolveAccentOptions } from './signatures';
