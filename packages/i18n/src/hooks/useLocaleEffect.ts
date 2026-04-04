/**
 * useLocaleEffect
 *
 * Synchronizes the document's <html lang> attribute and conditionally loads
 * Noto Sans Devanagari font when Nepali locale is active.
 *
 * Nepali (Devanagari script) is LTR — no dir attribute change needed.
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const DEVANAGARI_FONT_ID = 'edforge-devanagari-font'
const DEVANAGARI_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap'

function injectDevanagariFont() {
  if (document.getElementById(DEVANAGARI_FONT_ID)) return

  const link = document.createElement('link')
  link.id = DEVANAGARI_FONT_ID
  link.rel = 'stylesheet'
  link.href = DEVANAGARI_FONT_URL
  document.head.appendChild(link)
}

function removeDevanagariFont() {
  const link = document.getElementById(DEVANAGARI_FONT_ID)
  if (link) link.remove()
}

export function useLocaleEffect() {
  const { i18n } = useTranslation()

  useEffect(() => {
    function applyLocale(lang: string) {
      // Update <html lang> for accessibility and SEO
      document.documentElement.lang = lang

      // Conditionally load Devanagari font
      if (lang === 'ne') {
        injectDevanagariFont()
      } else {
        removeDevanagariFont()
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
