'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { memo } from 'react'

const Header = memo(function Header() {
  const pathname = usePathname()
  const { isDark, toggleTheme, classes } = useTheme()
  
  const bgColor = isDark ? 'bg-[rgba(18,18,26,0.5)]' : 'bg-[rgba(255,255,255,0.8)]'
  const borderColor = isDark ? 'border-[rgba(0,255,136,0.2)]' : 'border-[rgba(0,0,0,0.1)]'
  const activeColor = 'text-[#0f8]'

  return (
    <header className={`${bgColor} border-b ${borderColor} shadow-[0px_2px_20px_0px_rgba(0,255,136,0.1)]`}>
      <div className="max-w-[992px] mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 border-2 ${isDark ? 'border-[#0f8]' : 'border-[#10b981]'} rounded flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${isDark ? 'text-[#0f8]' : 'text-[#10b981]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-xl ${classes.titleColor} font-mono tracking-wide`}>SSH Capture The Flag</h1>
              <p className={`text-xs ${classes.textSecondary}`}>Maritime Cyber Training</p>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className={`font-mono ${pathname === '/' ? activeColor : classes.textTertiary} hover:text-[#0f8] transition-colors`}
            >
              Leaderboard
            </Link>
            <Link
              href="/join"
              className={`font-mono ${pathname === '/join' ? activeColor : classes.textTertiary} hover:text-[#0f8] transition-colors`}
            >
              Join session
            </Link>
            <Link
              href="/admin"
              className={`font-mono ${pathname?.startsWith('/admin') ? activeColor : classes.textTertiary} hover:text-[#0f8] transition-colors flex items-center gap-2`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin
            </Link>
            
            <button
              onClick={toggleTheme}
              className={`p-2 ${classes.hoverBg} rounded transition-colors`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg className={`w-5 h-5 ${classes.textTertiary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className={`w-5 h-5 ${classes.textTertiary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button className={`p-2 ${classes.hoverBg} rounded transition-colors`}>
              <svg className={`w-5 h-5 ${classes.textTertiary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
})

export default Header
