/**
 * @edforge/i18n
 *
 * Internationalization package for the EdForge EMIS platform.
 * Wraps i18next + react-i18next with preconfigured locales and
 * hooks for language switching, font loading, and locale effects.
 */

export { initI18n, i18n, SUPPORTED_LANGUAGES, LANGUAGE_LABELS, NAMESPACES } from './config'
export type { SupportedLanguage, Namespace } from './config'

export { useLocaleEffect } from './hooks/useLocaleEffect'

// Re-export the most commonly used react-i18next hooks/components
// so consumers don't need to depend on react-i18next directly.
export { useTranslation, Trans, I18nextProvider } from 'react-i18next'
