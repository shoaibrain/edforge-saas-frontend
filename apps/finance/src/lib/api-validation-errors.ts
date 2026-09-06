/**
 * Readers for the backend error envelope.
 *
 * Every error crosses the wire through the backend's GlobalExceptionFilter as
 *   { statusCode, errorCode, code?, message, errors?, details?, ...payload,
 *     timestamp, requestId, path }
 * where `code` is the domain error code the service threw (`AGREEMENT_ACTIVE`,
 * `CONFLICTING_OPEN_INVOICES`, …) and `payload` is whatever it threw alongside
 * (`agreementId`, `conflicts[]`, …). `errorCode` is only the HTTP status name
 * (`CONFLICT`, `BAD_REQUEST`) — never branch on it.
 *
 * nestjs-zod 400s carry `errors: [{ path: (string|number)[], message, code }]`
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

/** The domain error `code` the service threw (e.g. `AGREEMENT_ACTIVE`). */
export function extractApiErrorCode(err: unknown): string | null {
  const code = (responseData(err) as { code?: unknown } | null)?.code
  return typeof code === 'string' && code !== '' ? code : null
}

/** The whole error body, for callers that read the domain payload keys. */
export function extractApiErrorBody(err: unknown): Record<string, unknown> | null {
  return responseData(err) as Record<string, unknown> | null
}
