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
 * Get auth configuration from environment variables
 * Returns null if configuration is missing (dev mode without Cognito)
 */
export function getAuthConfig(): AuthConfig | null {
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID ?? ''
  const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID ?? ''
  const domain = import.meta.env.VITE_COGNITO_DOMAIN ?? ''
  const region = import.meta.env.VITE_COGNITO_REGION ?? 'us-east-1'
  const redirectSignIn = import.meta.env.VITE_REDIRECT_SIGN_IN ?? (typeof window !== 'undefined' ? window.location.origin : '')
  const redirectSignOut = import.meta.env.VITE_REDIRECT_SIGN_OUT ?? (typeof window !== 'undefined' ? window.location.origin : '')

  if (!userPoolId || !userPoolClientId || !domain) {
    console.warn(
      '[Auth] Missing Cognito configuration. ' +
      'Please ensure VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, ' +
      'and VITE_COGNITO_DOMAIN are set in your .env.local file. ' +
      'Running in dev mode without Cognito.'
    )
    return null
  }

  return {
    userPoolId,
    userPoolClientId,
    domain,
    region,
    redirectSignIn,
    redirectSignOut,
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

