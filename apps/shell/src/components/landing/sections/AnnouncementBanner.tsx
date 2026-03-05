import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'edforge-banner-dismissed'

export function AnnouncementBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    sessionStorage.setItem(STORAGE_KEY, '1')
  }

  return (
    <div className="relative z-[60] flex items-center justify-center gap-3 bg-gradient-to-r from-[#2a9d8f] to-[#1a4a5e] px-4 py-2.5 text-[0.8125rem] sm:text-sm text-white/95">
      <span className="text-center">
        EdForge is now available for K-12 districts.{' '}
        <a
          href="mailto:shoaibrain@edforge.net?subject=EdForge%20Demo%20Request"
          className="font-semibold underline underline-offset-2 decoration-white/40 hover:decoration-white/80 transition-colors"
        >
          Request early access
        </a>
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="ml-2 shrink-0 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
