'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, memo, useMemo, useEffect } from 'react'

import { useRouter } from 'next/navigation'
import { API } from '@/lib/api'

// Data will be fetched from database
interface SessionData {
  id: string
  dbId: string
  status: string
  startTime: string
  endTime: string
  duration: number
  participants: number
  flags: number
  winner: string
}

export default function AdminSessionsPage() {
  const { isDark, classes } = useTheme()
  const router = useRouter()
  const [filter, setFilter] = useState('All')
  const [sessionsData, setSessionsData] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Poll for sessions or fetch once? Ideally polling or SWR, but fetch once for now
    const fetchSessions = async () => {
      try {
        const res = await fetch(API.sessions())
        const data = await res.json()
        if (data.success && Array.isArray(data.sessions)) {
          const mapped = data.sessions.map((s: any) => ({
            id: s.sessionCode ? `#${s.sessionCode}` : s.id, // Use friendly code if available
            dbId: s.id, // Store real DB ID for navigation
            status: s.session_status === 'pending' ? 'Not Started' : s.session_status === 'active' ? 'In Progress' : 'Finished',
            startTime: new Date(s.createdAt).toLocaleString(),
            endTime: s.destroyedAt ? new Date(s.destroyedAt).toLocaleString() : '-',
            duration: Math.round((s.durationSecond || 3600) / 60),
            participants: 0, // Placeholder
            flags: s.totalFlag_count || 10,
            winner: '-'
          }))
          setSessionsData(mapped)
        }
      } catch (err) {
        console.error('Failed to fetch sessions', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
    // Optional: Poll every 10s
    const interval = setInterval(fetchSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  const { bgCard, borderColor, titleColor, textPrimary, textSecondary, textTertiary, buttonPrimary, buttonSecondary } = classes

  const getStatusColor = (status: string) => {
    if (status === 'Finished') {
      return isDark ? 'bg-[rgba(0,255,136,0.2)] text-[#0f8]' : 'bg-[#d1fae5] text-[#065f46]'
    }
    if (status === 'In Progress') {
      return isDark ? 'bg-[rgba(59,130,246,0.2)] text-[#3b82f6]' : 'bg-[#dbeafe] text-[#1e40af]'
    }
    return isDark ? 'bg-[rgba(128,128,144,0.2)] text-[#808090]' : 'bg-[#e5e7eb] text-[#4b5563]'
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex gap-2">
        {['All', 'Not Started', 'In Progress', 'Finished'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`${filter === filterOption ? buttonPrimary : buttonSecondary
              } px-4 py-2 rounded text-sm font-mono transition-all`}
          >
            {filterOption}
          </button>
        ))}
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessionsData.length === 0 ? (
          <div className={`col-span-full ${bgCard} border ${borderColor} rounded-lg p-12 text-center`}>
            <svg className={`w-16 h-16 mx-auto mb-4 ${textSecondary} opacity-50`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`${textSecondary} font-mono text-lg`}>No sessions yet</p>
            <p className={`${textSecondary} font-mono text-sm mt-2 opacity-75`}>Create your first session to get started</p>
          </div>
        ) : sessionsData
          .filter(s => filter === 'All' || s.status === filter)
          .map((session, idx) => (
            <div key={idx} className={`${bgCard} border ${borderColor} rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow`}>
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className={`text-xl font-mono font-bold ${titleColor}`}>{session.id}</h3>
                <span className={`${getStatusColor(session.status)} px-3 py-1 rounded-full text-xs font-mono`}>
                  {session.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`${textSecondary} text-sm font-mono`}>Start Time:</span>
                  <span className={`${textTertiary} text-sm font-mono`}>{session.startTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${textSecondary} text-sm font-mono`}>End Time:</span>
                  <span className={`${textTertiary} text-sm font-mono`}>{session.endTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${textSecondary} text-sm font-mono`}>Duration:</span>
                  <span className={`${textTertiary} text-sm font-mono`}>{session.duration} min</span>
                </div>

                <div className={`border-t ${borderColor} pt-3 mt-3`}>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className={`${titleColor} text-2xl font-mono font-bold`}>{session.participants}</p>
                      <p className={`${textSecondary} text-xs font-mono mt-1`}>Players</p>
                    </div>
                    <div>
                      <p className={`${titleColor} text-2xl font-mono font-bold`}>{session.flags}</p>
                      <p className={`${textSecondary} text-xs font-mono mt-1`}>Flags</p>
                    </div>
                    <div>
                      <p className={`${titleColor} text-2xl font-mono font-bold`}>
                        {session.status === 'Finished' ? '✓' : session.status === 'In Progress' ? '⏱' : '○'}
                      </p>
                      <p className={`${textSecondary} text-xs font-mono mt-1`}>Status</p>
                    </div>
                  </div>
                </div>

                {session.winner !== '-' && (
                  <div className={`border-t ${borderColor} pt-3 mt-3`}>
                    <div className="flex justify-between items-center">
                      <span className={`${textSecondary} text-sm font-mono`}>Winner:</span>
                      <span className={`text-[#FFD700] text-sm font-mono font-bold flex items-center gap-1`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {session.winner}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t ${borderColor}">
                <button
                  onClick={() => router.push(`/admin/sessions/${session.dbId}`)}
                  className={`w-full ${titleColor} hover:underline text-sm font-mono flex items-center justify-center gap-2`}
                >
                  View Details
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {/* Summary */}
      <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
        <h3 className={`text-lg font-mono ${textTertiary} mb-4`}>Session Statistics</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className={`text-3xl font-mono font-bold ${titleColor}`}>{sessionsData.length}</p>
            <p className={`${textSecondary} text-sm font-mono mt-1`}>Total Sessions</p>
          </div>
          <div>
            <p className={`text-3xl font-mono font-bold text-[#3b82f6]`}>
              {sessionsData.filter(s => s.status === 'In Progress').length}
            </p>
            <p className={`${textSecondary} text-sm font-mono mt-1`}>Active Now</p>
          </div>
          <div>
            <p className={`text-3xl font-mono font-bold ${titleColor}`}>
              {sessionsData.filter(s => s.status === 'Finished').length}
            </p>
            <p className={`${textSecondary} text-sm font-mono mt-1`}>Completed</p>
          </div>
          <div>
            <p className={`text-3xl font-mono font-bold ${textSecondary}`}>
              {sessionsData.filter(s => s.status === 'Finished').length > 0
                ? Math.round(sessionsData.filter(s => s.status === 'Finished').reduce((acc, s) => acc + s.duration, 0) / sessionsData.filter(s => s.status === 'Finished').length)
                : 0}
            </p>
            <p className={`${textSecondary} text-sm font-mono mt-1`}>Avg Duration (min)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
