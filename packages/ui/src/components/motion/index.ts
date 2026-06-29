/**
 * EdForge — Signature animated-icon system (@edforge/ui/motion).
 *
 * The CSS engine ships from @edforge/theme (icon-motion.css); this entry exports the
 * React surface: the AnimatedIcon wrapper, the glyph set, and the signature/accent
 * registry.
 *
 * To animate an icon, render `<AnimatedIcon name="<signature>" />` (the explicit,
 * preferred path — see the shell's NAV_SIGNATURE / each MFE's TAB_SIGNATURE maps).
 * `registerSignature(icon, name)` is an optional convenience so a bare
 * `<AnimatedIcon icon={SomeLucideIcon} />` resolves to a signature automatically;
 * `replay()` (via the component ref) is available for imperative re-fire, though the
 * shell triggers signatures purely from CSS hover/focus/active state.
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
