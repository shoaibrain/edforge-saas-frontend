/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly VITE_EDFI_URL?: string
  readonly VITE_ACADEMICS_URL?: string
  readonly VITE_FINANCE_URL?: string
  readonly VITE_PEOPLE_URL?: string
  readonly VITE_PORTAL_URL?: string
  readonly VITE_INTEGRATIONS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

