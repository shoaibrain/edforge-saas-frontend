import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  const root = document.documentElement
  
  if (resolvedTheme === 'dark') {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      resolvedTheme: 'light',
      
      setTheme: (theme: Theme) => {
        const resolvedTheme = resolveTheme(theme)
        applyTheme(resolvedTheme)
        set({ theme, resolvedTheme })
      },
    }),
    {
      name: 'edforge-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state) {
          const resolvedTheme = resolveTheme(state.theme)
          applyTheme(resolvedTheme)
          state.resolvedTheme = resolvedTheme
        }
      },
    }
  )
)

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('edforge-theme')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      const resolvedTheme = resolveTheme(state.theme || 'system')
      applyTheme(resolvedTheme)
    } catch {
      applyTheme('light')
    }
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const { theme } = useThemeStore.getState()
    if (theme === 'system') {
      const resolvedTheme = e.matches ? 'dark' : 'light'
      applyTheme(resolvedTheme)
      useThemeStore.setState({ resolvedTheme })
    }
  })
}

