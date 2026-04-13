/**
 * Amplify Configuration
 * 
 * Configures AWS Amplify for Cognito authentication with OAuth2/PKCE flow.
 */

import { Amplify, type ResourcesConfig } from 'aws-amplify'
import type { AuthConfig } from './types'

// Vite environment variables type declaration
declare global {
  interface ImportMeta {
    env: {
      VITE_COGNITO_USER_POOL_ID?: string
      VITE_COGNITO_CLIENT_ID?: string
      VITE_COGNITO_DOMAIN?: string
      VITE_COGNITO_REGION?: string
      VITE_REDIRECT_SIGN_IN?: string
      VITE_REDIRECT_SIGN_OUT?: string
      VITE_API_URL?: string
      [key: string]: string | undefined
    }
  }
}

/**
 * Get auth configuration from environment variables.
 *
 * In production: throws if any required Cognito env var is missing.
 * In development: returns null if env vars are missing (allows running without Cognito).
 */
export function getAuthConfig(): AuthConfig | null {
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID
  const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID
  const domain = import.meta.env.VITE_COGNITO_DOMAIN
  const region = import.meta.env.VITE_COGNITO_REGION
  const redirectSignIn = import.meta.env.VITE_REDIRECT_SIGN_IN
  const redirectSignOut = import.meta.env.VITE_REDIRECT_SIGN_OUT

  const missing = [
    !userPoolId && 'VITE_COGNITO_USER_POOL_ID',
    !userPoolClientId && 'VITE_COGNITO_CLIENT_ID',
    !domain && 'VITE_COGNITO_DOMAIN',
    !region && 'VITE_COGNITO_REGION',
    !redirectSignIn && 'VITE_REDIRECT_SIGN_IN',
    !redirectSignOut && 'VITE_REDIRECT_SIGN_OUT',
  ].filter(Boolean)

  if (missing.length > 0) {
    if (import.meta.env.PROD) {
      throw new Error(
        `[Auth] Missing required environment variables: ${missing.join(', ')}. ` +
        `Check Vercel environment configuration.`
      )
    }
    console.warn(
      `[Auth] Missing Cognito configuration: ${missing.join(', ')}. ` +
      `Set them in .env.local for local development, or running without Cognito.`
    )
    return null
  }

  return {
    userPoolId: userPoolId!,
    userPoolClientId: userPoolClientId!,
    domain: domain!,
    region: region!,
    redirectSignIn: redirectSignIn!,
    redirectSignOut: redirectSignOut!,
    scopes: ['openid', 'email', 'profile'],
  }
}

/**
 * Configure AWS Amplify with Cognito settings
 * Must be called once at application startup (in main.tsx)
 * Returns false if configuration is missing (dev mode)
 */
export function configureAmplify(): boolean {
  const config = getAuthConfig()

  if (!config) {
    return false
  }

  const amplifyConfig: ResourcesConfig = {
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        loginWith: {
          oauth: {
            domain: config.domain,
            scopes: config.scopes as ['openid', 'email', 'profile'],
            redirectSignIn: [config.redirectSignIn],
            redirectSignOut: [config.redirectSignOut],
            responseType: 'code', // Authorization code grant with PKCE
          },
        },
      },
    },
  }

  Amplify.configure(amplifyConfig)
  return true
}

/**
 * Check if Amplify has been configured
 */
export function isAmplifyConfigured(): boolean {
  try {
    const config = Amplify.getConfig()
    return !!config.Auth?.Cognito?.userPoolId
  } catch {
    return false
  }
}

