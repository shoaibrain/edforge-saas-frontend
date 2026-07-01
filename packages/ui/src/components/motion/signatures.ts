/**
 * EdForge — Signature registry contract.
 *
 * Maps an icon to (a) its signature glyph name and (b) its accent hue. Call sites
 * pair an item to a signature explicitly via the `name` prop (see the shell's
 * NAV_SIGNATURE and each MFE's TAB_SIGNATURE maps); `registerSignature` is an
 * optional convenience for auto-resolving a bare lucide icon. The CSS engine
 * (packages/theme/src/icon-motion.css) does the rest, keyed off the part classes
 * the signature glyph renders — there is no per-MFE animation code.
 *
 * Accent assignment + the 8-hue chroma family are ported from the locked prototype
 * (edforge/final/app.jsx). `resolveAccent` returns the inline `--accent` value;
 * mono mode is resolved HERE (returns the mono color), never via a CSS class, so it
 * wins over per-item inline accents without `!important`.
 */
import type { IconName } from './icons';

export type AccentHue =
  | 'emerald' | 'violet' | 'amber' | 'sky' | 'blue' | 'teal' | 'rose' | 'indigo'
  | 'slate';

export type AccentMode = 'module' | 'mono';

/** Per-icon accent (from the prototype's ACCENT map). */
export const ICON_ACCENT: Record<IconName, AccentHue> = {
  // primary nav
  home: 'emerald',
  academics: 'violet',
  people: 'amber',
  finance: 'teal',
  settings: 'blue',
  // finance alternates
  finance_receipt: 'teal',
  finance_note: 'teal',
  // academics surfaces
  overview: 'blue',
  students: 'violet',
  classrooms: 'indigo',
  curriculum: 'emerald',
  exams: 'rose',
  attendance: 'amber',
  // people / record
  staff: 'sky',
  family: 'amber',
  profile: 'teal',
  enrollment: 'emerald',
  demographics: 'violet',
  // metrics & status
  metric_attendance: 'emerald',
  gpa: 'amber',
  sections: 'blue',
  fees: 'teal',
  atrisk: 'rose',
  // actions & toolbar
  create: 'emerald',
  export: 'sky',
  search: 'blue',
  filter: 'indigo',
  edit: 'amber',
  remove: 'rose',
  more: 'slate',
  refresh: 'teal',
  notifications: 'violet',
  // settings sub-nav (production)
  workspace: 'indigo',
  configuration: 'blue',
  account: 'teal',
  preferences: 'violet',
  security: 'emerald',
  organization: 'amber',
  rbac: 'rose',
  authdebug: 'sky',
  academicsetup: 'emerald',
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
  // nav + settings sub-nav (Round 1/2)
  Home: 'home',
  GraduationCap: 'academics',
  UsersRound: 'people',
  Settings: 'settings',
  ShieldCheck: 'security',
  Building2: 'organization',
  Bug: 'authdebug',
  GalleryVerticalEnd: 'overview',

  // finance — retire the $: DollarSign/Wallet now resolve to the curated Wallet glyph
  DollarSign: 'finance',
  Wallet: 'finance',
  Receipt: 'finance_receipt',
  Banknote: 'finance_note',

  // action / toolbar glyphs whose lucide silhouette ≈ the signature glyph (safe auto-swap)
  Plus: 'create',
  Trash2: 'remove',
  Pencil: 'edit',
  SquarePen: 'edit',
  Edit2: 'edit',
  Edit3: 'edit',
  Search: 'search',
  Filter: 'filter',
  Download: 'export',
  MoreHorizontal: 'more',
  RotateCcw: 'refresh',
  RefreshCw: 'refresh',
  Bell: 'notifications',
  AlertTriangle: 'atrisk',
  UserPlus: 'enrollment',
  BookOpen: 'curriculum',
  LayoutGrid: 'sections',

  // NOTE — silhouette-divergent education glyphs (School→classrooms, IdCard→demographics,
  // ClipboardList→exams, ClipboardCheck→attendance, Target→metric_attendance, Award→gpa,
  // CreditCard→finance, Briefcase→staff) are intentionally NOT auto-resolved here: a bare
  // <AnimatedIcon icon={X}/> must not silently swap to a different-looking glyph. Those are
  // wired explicitly at call sites via the `name` prop (per the Round-4 per-MFE sweep).
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
