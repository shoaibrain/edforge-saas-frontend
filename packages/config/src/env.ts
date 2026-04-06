/**
 * Environment Variable Validation
 *
 * Ensures all required VITE_* environment variables are set at build/runtime.
 * If any are missing, the app fails loudly instead of silently using stale defaults.
 */

/**
 * Require a Vite environment variable to be set.
 * Throws with a clear message if the variable is missing or empty.
 */
export function requireEnv(name: string): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(
      `Required environment variable ${name} is not set. ` +
      `Check Vercel environment configuration or your .env.local file.`
    )
  }
  return value
}
