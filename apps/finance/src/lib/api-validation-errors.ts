/**
 * Mapper for nestjs-zod 400 validation bodies.
 *
 * The backend rejects invalid DTOs with:
 *   { statusCode: 400, message: 'Validation failed',
 *     errors: [{ path: (string|number)[], message, code }] }
 * mirrored under `details.validationErrors` with dotted path strings. The
 * messages are backend-authored, operator-readable strings (they carry the
 * cross-field invariant explanations), so callers surface them verbatim.
 */

export interface ApiValidationError {
  /** Dotted path into the rejected DTO, e.g. `coveredFeeTypes.0`. */
  path: string
  message: string
}

interface ErrorBodyShape {
  message?: unknown
  errors?: unknown
  details?: { validationErrors?: unknown }
}

function responseData(err: unknown): ErrorBodyShape | null {
  const data = (err as { response?: { data?: unknown } } | null | undefined)
    ?.response?.data
  return data && typeof data === 'object' ? (data as ErrorBodyShape) : null
}

function toDottedPath(path: unknown): string {
  if (Array.isArray(path)) return path.map(String).join('.')
  if (typeof path === 'string') return path
  return ''
}

function normalizeEntries(entries: unknown): ApiValidationError[] {
  if (!Array.isArray(entries)) return []
  return entries
    .filter(
      (entry): entry is { path?: unknown; message?: unknown } =>
        !!entry && typeof entry === 'object',
    )
    .map((entry) => ({
      path: toDottedPath(entry.path),
      message: typeof entry.message === 'string' ? entry.message : '',
    }))
    .filter((entry) => entry.message !== '')
}

/**
 * Structured validation errors from a nestjs-zod 400, `[]` for anything
 * else (network errors, 4xx/5xx without the shape, non-axios errors).
 */
export function extractValidationErrors(err: unknown): ApiValidationError[] {
  const data = responseData(err)
  if (!data) return []
  const fromErrors = normalizeEntries(data.errors)
  if (fromErrors.length > 0) return fromErrors
  return normalizeEntries(data.details?.validationErrors)
}

/** The backend's top-level error message, when the response carries one. */
export function extractApiMessage(err: unknown): string | null {
  const message = responseData(err)?.message
  return typeof message === 'string' && message.trim() !== '' ? message : null
}
