/**
 * EdForge — Signature registry contract.
 *
 * Maps an icon to (a) its signature glyph name and (b) its accent hue. The shell
 * and every MFE animate icons by registering `{ icon, signature }` ONCE here — no
 * per-MFE animation code. The CSS engine (packages/theme/src/icon-motion.css) does
 * the rest, keyed off the part classes the signature glyph renders.
 *
 * Accent assignment + the 8-hue chroma family are ported from the locked prototype
 * (edforge/final/app.jsx). `resolveAccent` returns the inline `--accent` value;
 * mono mode is resolved HERE (returns the mono color), never via a CSS class, so it
 * wins over per-item inline accents without `!important`.
 */
import type { IconName } from './icons';

export type AccentHue =
  | 'emerald' | 'violet' | 'amber' | 'sky' | 'blue' | 'teal' | 'rose' | 'indigo';

export type AccentMode = 'module' | 'mono';

/** Per-icon accent (from the prototype's ACCENT map). */
export const ICON_ACCENT: Record<IconName, AccentHue> = {
  home: 'emerald',
  academics: 'violet',
  people: 'amber',
  finance: 'teal',
  settings: 'blue',
  overview: 'blue',
  account: 'teal',
  preferences: 'violet',
  security: 'emerald',
  workspace: 'indigo',
  organization: 'amber',
  rbac: 'rose',
  authdebug: 'sky',
  configuration: 'blue',
  academicsetup: 'emerald',
  attendance: 'amber',
  structure: 'violet',
  gradelevels: 'teal',
  auditlog: 'sky',
};

export interface ResolveAccentOptions {
  /** 'mono' overrides every item with `mono`; 'module' uses the per-icon hue. */
  mode?: AccentMode;
  /** The mono accent color (any CSS color, e.g. an oklch() string). */
  mono?: string;
  /** Explicit hue override, wins over the icon's default hue. */
  accent?: AccentHue;
}

/**
 * Resolve the value to assign to the inline `--accent` custom property.
 * Mono mode returns the mono color directly (matches the prototype) so it beats
 * any per-item inline accent without needing `!important`.
 */
export function resolveAccent(
  name: IconName | undefined,
  opts: ResolveAccentOptions = {},
): string {
  if (opts.mode === 'mono' && opts.mono) return opts.mono;
  const hue = opts.accent ?? (name ? ICON_ACCENT[name] : undefined);
  return `var(--a-${hue ?? 'emerald'})`;
}

/**
 * Registry: lucide-react `displayName` → signature glyph name. Lets a consumer
 * pass a plain Lucide icon and get the matching animated glyph WITHOUT an explicit
 * `name`. Deliberately conservative: it only contains glyphs whose Lucide shape is
 * (near-)identical to the signature glyph, so a bare `<AnimatedIcon icon={X} />`
 * never silently swaps a recognisable icon for a different-looking one. Anything
 * ambiguous (e.g. School, Wallet, Calendar) must be paired explicitly — either via
 * an explicit `name` prop or `registerSignature(icon, name)`.
 */
const DISPLAY_NAME_TO_SIGNATURE: Record<string, IconName> = {
  Home: 'home',
  GraduationCap: 'academics',
  UsersRound: 'people',
  DollarSign: 'finance',
  Settings: 'settings',
  ShieldCheck: 'security',
  Building2: 'organization',
  Bug: 'authdebug',
  GalleryVerticalEnd: 'overview',
};

/** Resolve a signature glyph name from a lucide-react component's displayName. */
export function nameForLucide(displayName: string | undefined): IconName | undefined {
  return displayName ? DISPLAY_NAME_TO_SIGNATURE[displayName] : undefined;
}

/**
 * Register a `{ icon, signature }` pairing once. `icon` may be a lucide component
 * (its `displayName` is used) or an explicit display-name string. A new MFE calls
 * this at module load and the shell animates its icons automatically.
 */
export function registerSignature(
  icon: { displayName?: string } | string,
  signature: IconName,
): void {
  const key = typeof icon === 'string' ? icon : icon.displayName;
  if (key) DISPLAY_NAME_TO_SIGNATURE[key] = signature;
}
