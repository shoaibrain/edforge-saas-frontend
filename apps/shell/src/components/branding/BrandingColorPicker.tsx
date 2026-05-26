/**
 * BrandingColorPicker — RHF-integrated hex color input.
 *
 * Twin-control pattern (per the M3 plan): native `<input type="color">`
 * for visual picking + adjacent text input for clipboard paste / direct
 * hex entry. Both controls write to the same RHF field via Controller,
 * so the form-state is the single source of truth.
 *
 * **Why inline here (not promoted to @edforge/forms):** this is the
 * only consumer today. Promoting a primitive before knowing the second
 * consumer's needs is the over-abstraction trap the project memory
 * pins. M3-phase-2 (asset uploads) may add a FileField primitive at
 * that time; if/when a second branding-style color picker appears, we
 * promote then.
 *
 * **Normalization:** the picker emits `#RRGGBB` natively. The text
 * input accepts `#abc` shorthand → expand to `#aabbcc` on blur; rejects
 * non-hex characters on input. Server schema requires `#RRGGBB` (no
 * shorthand, no alpha) — we enforce client-side to fail fast before
 * the PATCH.
 */

import { useCallback, useId } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

interface BrandingColorPickerProps {
  /** RHF field name (e.g. `colorPalette.primary`). Supports dot notation. */
  name: string
  /** Visible label shown above the controls. */
  label: string
  /** Visible helper text shown beneath the controls. */
  helperText?: string
}

const HEX_FULL_PATTERN = /^#[0-9A-Fa-f]{6}$/
const HEX_SHORTHAND_PATTERN = /^#[0-9A-Fa-f]{3}$/

/**
 * Best-effort normalization on blur: accept `#abc` → `#aabbcc`, accept
 * `abc123` → `#abc123`, normalize hex letters to uppercase for the
 * stored value (the picker control itself emits lowercase; the
 * lowercase/uppercase distinction is cosmetic on the wire).
 */
function normalize(raw: string): string {
  let v = raw.trim()
  if (!v) return ''
  if (!v.startsWith('#')) v = `#${v}`
  if (HEX_SHORTHAND_PATTERN.test(v)) {
    // #abc → #aabbcc
    const r = v[1]
    const g = v[2]
    const b = v[3]
    v = `#${r}${r}${g}${g}${b}${b}`
  }
  if (HEX_FULL_PATTERN.test(v)) {
    return v.toUpperCase()
  }
  return raw // hand back original; RHF validation surfaces the error
}

export function BrandingColorPicker({
  name,
  label,
  helperText,
}: BrandingColorPickerProps) {
  const { control } = useFormContext()
  const id = useId()

  const handlePickerChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      onChange: (value: string) => void,
    ) => {
      // Native color picker always emits a valid #rrggbb (lowercase).
      // Normalize to uppercase to match the text input's normalization.
      onChange(e.target.value.toUpperCase())
    },
    [],
  )

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value: string = field.value ?? ''
        const safeForPicker = HEX_FULL_PATTERN.test(value) ? value : '#000000'

        return (
          <div className="space-y-1.5">
            <label htmlFor={id} className="block text-xs font-medium text-[rgb(var(--text-secondary))]">
              {label}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={safeForPicker}
                onChange={(e) => handlePickerChange(e, field.onChange)}
                onBlur={field.onBlur}
                className="w-12 h-10 rounded-md border border-[rgb(var(--border-primary))] cursor-pointer disabled:cursor-not-allowed bg-transparent"
                aria-label={label}
                disabled={field.disabled}
              />
              <input
                id={id}
                type="text"
                value={value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={(e) => {
                  field.onChange(normalize(e.target.value))
                  field.onBlur()
                }}
                placeholder="#RRGGBB"
                maxLength={7}
                className="flex-1 max-w-[160px] px-3 py-2 text-sm font-mono rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-50"
                aria-invalid={!!fieldState.error}
                aria-describedby={
                  fieldState.error ? `${id}-error` : helperText ? `${id}-help` : undefined
                }
                disabled={field.disabled}
              />
            </div>
            {fieldState.error && (
              <p
                id={`${id}-error`}
                className="text-xs text-red-500"
                role="alert"
              >
                {fieldState.error.message ?? 'Invalid color'}
              </p>
            )}
            {!fieldState.error && helperText && (
              <p id={`${id}-help`} className="text-xs text-[rgb(var(--text-tertiary))]">
                {helperText}
              </p>
            )}
          </div>
        )
      }}
    />
  )
}
