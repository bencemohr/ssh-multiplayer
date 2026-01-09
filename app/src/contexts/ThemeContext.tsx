'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  mounted: boolean
  toggleTheme: () => void
  classes: {
    bgMain: string
    bgCard: string
    borderColor: string
    titleColor: string
    textPrimary: string
    textSecondary: string
    textTertiary: string
    inputBg: string
    inputBorder: string
    buttonPrimary: string
    buttonSecondary: string
    hoverRow: string
    hoverBg: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always start with 'dark' to match server render, then sync with localStorage
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read theme from localStorage after mount
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    // Update data-theme attribute when theme changes (after initial mount)
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    }
  }, [theme, mounted])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', newTheme)
      return newTheme
    })
  }, [])

  const value = useMemo(() => {
    const isDark = theme === 'dark'
    return {
      theme,
      isDark,
      mounted,
      toggleTheme,
      classes: {
        bgMain: isDark ? 'bg-[#0a0a0f]' : 'bg-[#f9fafb]',
        bgCard: isDark ? 'bg-[#12121a]' : 'bg-white',
        borderColor: isDark ? 'border-[rgba(0,255,136,0.2)]' : 'border-[#e5e7eb]',
        titleColor: isDark ? 'text-[#0f8]' : 'text-[#1a1a1a]',
        textPrimary: isDark ? 'text-white' : 'text-[#1f2937]',
        textSecondary: isDark ? 'text-[#808090]' : 'text-[#6b7280]',
        textTertiary: isDark ? 'text-[#e0e0e0]' : 'text-[#374151]',
        inputBg: isDark ? 'bg-[#1a1a28]' : 'bg-[#f3f4f6]',
        inputBorder: isDark ? 'border-[rgba(0,255,136,0.2)]' : 'border-[#d1d5db]',
        buttonPrimary: 'bg-[#0f8] text-[#0a0a0f] hover:shadow-[0px_0px_20px_0px_rgba(0,255,136,0.3)]',
        buttonSecondary: isDark ? 'bg-[#1a1a28] text-[#e0e0e0] hover:bg-[#252530]' : 'bg-[#e5e7eb] text-[#374151] hover:bg-[#d1d5db]',
        hoverRow: isDark ? 'hover:bg-[rgba(0,255,136,0.03)]' : 'hover:bg-[#f9fafb]',
        hoverBg: isDark ? 'hover:bg-[#1a1a28]' : 'hover:bg-[#f3f4f6]',
      }
    }
  }, [theme, mounted, toggleTheme])

  // Use CSS to hide content until mounted to prevent flash
  // The inline script in layout.tsx sets the correct background immediately
  return (
    <ThemeContext.Provider value={value}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
