'use client'

import Header from '@/components/Header'
import { useTheme } from '@/contexts/ThemeContext'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, memo, useMemo, useCallback, useState, useEffect } from 'react'

interface AdminTab {
  id: string
  label: string
  path: string
  icon: ReactNode
}

// Memoized tab button component
const TabButton = memo(function TabButton({
  tab,
  isActive,
  activeClass,
  inactiveClass,
  onClick
}: {
  tab: AdminTab
  isActive: boolean
  activeClass: string
  inactiveClass: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded font-mono text-sm transition-colors ${isActive ? activeClass : inactiveClass}`}
    >
      {tab.icon}
      {tab.label}
    </button>
  )
})

// Static tabs data - defined outside component
const createTabs = (): AdminTab[] => [
  {
    id: 'overview',
    label: 'Overview',
    path: '/admin',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  },
  {
    id: 'players',
    label: 'Players',
    path: '/admin/players',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  },
  {
    id: 'sessions',
    label: 'Sessions',
    path: '/admin/sessions',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/admin/settings',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isDark, classes } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  // Auth Guard
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      window.location.href = '/login'
    } else {
      setAuthorized(true)
    }
  }, [])

  const { bgMain, bgCard, borderColor, titleColor, textSecondary, textPrimary } = classes
  const activeTab = 'bg-[#0f8] text-[#0a0a0f]'
  const inactiveTab = isDark ? 'bg-transparent text-[#e0e0e0] hover:bg-[#1a1a28]' : 'bg-transparent text-[#374151] hover:bg-[#f3f4f6]'

  const tabs = useMemo(() => createTabs(), [])

  const handleTabClick = useCallback((path: string) => {
    router.push(path)
  }, [router])

  // Prevent flash of unauthenticated content
  if (!authorized) {
    return null
  }

  return (
    <div className={`min-h-screen ${bgMain} ${textPrimary}`}>
      <Header />

      <main className="max-w-[992px] mx-auto px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className={`text-3xl font-mono ${titleColor} mb-2`}>Admin Dashboard</h2>
          <p className={textSecondary}>Manage training sessions and monitor participants</p>
        </div>

        {/* Tabs */}
        <div className={`${bgCard} border ${borderColor} rounded-lg p-1 mb-8`}>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={pathname === tab.path}
                activeClass={activeTab}
                inactiveClass={inactiveTab}
                onClick={() => handleTabClick(tab.path)}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        {children}
      </main>
    </div>
  )
}
