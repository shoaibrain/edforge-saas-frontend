/**
 * useLocaleEffect
 *
 * Synchronizes the document's <html lang>/<html dir> attributes and conditionally loads
 * script-specific web fonts for localized languages.
 *
 * Nepali and Hindi are Devanagari LTR languages. Arabic is RTL.
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getLanguageDirection } from '../language'

const DEVANAGARI_FONT_ID = 'edforge-devanagari-font'
const DEVANAGARI_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap'
const DEVANAGARI_LANGUAGES = new Set(['ne', 'hi'])
const ARABIC_FONT_ID = 'edforge-arabic-font'
const ARABIC_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap'

function injectFont(id: string, href: string) {
  if (document.getElementById(id)) return

  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

function removeFont(id: string) {
  const link = document.getElementById(id)
  if (link) link.remove()
}

export function useLocaleEffect() {
  const { i18n } = useTranslation()

  useEffect(() => {
    function applyLocale(lang: string) {
      // Update <html lang> for accessibility and SEO
      document.documentElement.lang = lang

      const baseLanguage = lang.split('-')[0]
      document.documentElement.dir = getLanguageDirection(lang)

      // Conditionally load script-specific fonts.
      if (DEVANAGARI_LANGUAGES.has(baseLanguage)) {
        injectFont(DEVANAGARI_FONT_ID, DEVANAGARI_FONT_URL)
      } else {
        removeFont(DEVANAGARI_FONT_ID)
      }

      if (baseLanguage === 'ar') {
        injectFont(ARABIC_FONT_ID, ARABIC_FONT_URL)
      } else {
        removeFont(ARABIC_FONT_ID)
      }
    }

    // Apply immediately for current language
    applyLocale(i18n.language)

    // Listen for language changes
    i18n.on('languageChanged', applyLocale)

    return () => {
      i18n.off('languageChanged', applyLocale)
    }
  }, [i18n])
}
