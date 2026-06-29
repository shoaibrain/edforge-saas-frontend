/**
 * EdForge — AnimatedIcon.
 *
 * Wraps a signature glyph in the `.nav-ico` holder. CSS owns the motion (triggered
 * by a `.ef-motion` / `[role="tab"]` ancestor); this component only:
 *   - resolves which glyph + accent to render (by explicit `name`, or by mapping a
 *     lucide `icon`'s displayName through the registry),
 *   - sets the per-item `--accent` on its own holder so the icon is accented in ANY
 *     host (nav buttons AND tabs),
 *   - exposes imperative `replay()` (a key-remount that restarts the CSS animation),
 *   - falls back to rendering the plain lucide glyph statically when no signature is
 *     registered (the resting state is always a correct, complete glyph).
 *
 * Motion is gated by the CSS reduced-motion query; `useReducedMotion()` additionally
 * no-ops the JS replay path.
 */
import {
  forwardRef,
  useImperativeHandle,
  useState,
  type CSSProperties,
} from 'react';
import { useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { EFIcon, type IconName } from './icons';
import {
  nameForLucide,
  resolveAccent,
  type AccentHue,
  type AccentMode,
} from './signatures';

export interface AnimatedIconHandle {
  /** Replay the signature once (no-op under prefers-reduced-motion). */
  replay: () => void;
}

export interface AnimatedIconProps {
  /** Explicit signature glyph name (preferred at precise call sites). */
  name?: IconName;
  /** A lucide-react icon; resolved to a signature via the registry, else rendered static. */
  icon?: LucideIcon;
  /** Explicit accent hue override. */
  accent?: AccentHue;
  /** 'module' (per-icon hue, default) or 'mono' (global override). */
  accentMode?: AccentMode;
  /** Mono accent color used when accentMode === 'mono'. */
  monoAccent?: string;
  /** Glyph size in px (default 22). */
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Set `--accent` on the holder (default true). Turn off if an ancestor owns it. */
  applyAccent?: boolean;
}

export const AnimatedIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  function AnimatedIcon(
    {
      name,
      icon,
      accent,
      accentMode = 'module',
      monoAccent,
      size = 22,
      strokeWidth = 1.7,
      className,
      applyAccent = true,
    },
    ref,
  ) {
    const prefersReducedMotion = useReducedMotion();
    const [replayKey, setReplayKey] = useState(0);

    useImperativeHandle(
      ref,
      () => ({
        replay: () => {
          if (!prefersReducedMotion) setReplayKey((k) => k + 1);
        },
      }),
      [prefersReducedMotion],
    );

    const resolved: IconName | undefined =
      name ?? nameForLucide((icon as { displayName?: string } | undefined)?.displayName);

    const accentValue = resolveAccent(resolved, {
      mode: accentMode,
      mono: monoAccent,
      accent,
    });
    const style = applyAccent
      ? ({ '--accent': accentValue } as CSSProperties)
      : undefined;
    const holderClass = ['nav-ico', className].filter(Boolean).join(' ');

    // Graceful fallback: no registered signature → static lucide glyph.
    if (!resolved) {
      if (!icon) return null;
      const Lucide = icon;
      return (
        <span className={holderClass} style={style}>
          <Lucide size={size} strokeWidth={strokeWidth} aria-hidden="true" />
        </span>
      );
    }

    return (
      <span className={holderClass} style={style}>
        <EFIcon key={replayKey} name={resolved} size={size} strokeWidth={strokeWidth} />
      </span>
    );
  },
);
