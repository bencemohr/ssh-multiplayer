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
  start: string
  end: string
  participants: number
  durationSeconds: number
}

// Memoized session row component
const SessionRow = memo(function SessionRow({
  session,
  isDark,
  borderColor,
  hoverRow,
  textTertiary,
  titleColor,
  onViewDetails
}: {
  session: SessionData
  isDark: boolean
  borderColor: string
  hoverRow: string
  textTertiary: string
  titleColor: string
  onViewDetails: (id: string) => void
}) {
  return (
    <tr className={`border-b ${borderColor} ${hoverRow} transition-colors`}>
      <td className={`py-4 px-4 font-mono ${textTertiary}`}>{session.id}</td>
      <td className="py-4 px-4">
        <span className={`inline-block ${isDark ? 'bg-[rgba(1,255,136,0.2)]' : 'bg-[#d1fae5]'} ${isDark ? 'text-[#0f8]' : 'text-[#065f46]'} px-3 py-1 rounded-full text-xs font-mono`}>
          {session.status}
        </span>
      </td>
      <td className={`py-4 px-4 font-mono ${textTertiary}`}>{session.start}</td>
      <td className={`py-4 px-4 font-mono ${textTertiary}`}>{session.end}</td>
      <td className={`py-4 px-4 font-mono ${textTertiary}`}>{session.participants}</td>
      <td className="py-4 px-4">
        <button
          onClick={() => onViewDetails(session.dbId)}
          className={`${titleColor} hover:underline text-sm font-mono flex items-center gap-1`}
        >
          View results
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </td>
    </tr>
  )
})

export default function AdminOverviewPage() {
  const { isDark, classes } = useTheme()
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [activeSession, setActiveSession] = useState<SessionData | null>(null)
  const [newSessionDuration, setNewSessionDuration] = useState(60)
  const [loading, setLoading] = useState(false)

  const [sessionFilter, setSessionFilter] = useState<'All' | 'Not started' | 'In progress' | 'Finished'>('All')

  const { bgCard, borderColor, titleColor, textSecondary, textTertiary, inputBg, inputBorder, buttonPrimary, buttonSecondary, hoverRow } = classes
  const inputDarkBg = isDark ? 'bg-[#0a0a0f] text-white' : `${inputBg} ${textTertiary}`

  const fetchSessions = async () => {
    try {
      const res = await fetch(API.sessions())
      // ... (skip lines) ...
      // This is too big to replace everything easily. Let's do two edits.
      // Edit 1: Fix top of function.
      // Edit 2: Fix loop.

      const data = await res.json()
      if (data.success && Array.isArray(data.sessions)) {
        const mapped = data.sessions.map((s: any) => ({
          id: s.sessionCode ? `#${s.sessionCode}` : s.id,
          dbId: s.id,
          status: s.session_status === 'pending' ? 'Not started' : s.session_status === 'active' ? 'In progress' : 'Finished',
          start: new Date(s.createdAt).toLocaleString(),
          end: s.destroyedAt ? new Date(s.destroyedAt).toLocaleString() : '-',
          participants: 0,
          durationSeconds: parseInt(s.durationSecond || 3600)
        }))
        setSessions(mapped)

        // Find active or pending session
        const active = mapped.find((s: any) => s.status === 'In progress' || s.status === 'Not started')
        setActiveSession(active || null)
      }
    } catch (err) {
      console.error('Failed to fetch sessions', err)
    }
  }

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    // Optional: We can show a loading spinner here for data fetching if we want
    // but 'authLoading' was removed as layout handles it.
  }

  const handleUpdateStatus = async (status: string) => {
    if (!activeSession) return
    setLoading(true)
    try {
      // Map API status: pending, active, completed
      let apiStatus = 'pending'
      if (status === 'In progress') apiStatus = 'active'
      if (status === 'Finished') apiStatus = 'completed'

      await fetch(API.sessionStatus(activeSession.dbId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: apiStatus })
      })
      await fetchSessions()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Filter recent sessions based on status
  const filteredSessions = useMemo(() => {
    if (sessionFilter === 'All') return sessions
    return sessions.filter(session => session.status === sessionFilter)
  }, [sessions, sessionFilter])

  return (
    <div className="space-y-8">
      {/* Session Control */}
      <div className="grid grid-cols-2 gap-6">
        <div className={`${bgCard} border ${borderColor} rounded-lg p-6 shadow-lg`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xl font-mono ${textTertiary}`}>Session Control</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className={`block ${textSecondary} text-sm font-mono mb-2`}>Session ID</label>
              <div className={`${inputBg} border ${borderColor} rounded px-4 py-3 ${textTertiary} font-mono`}>
                {activeSession ? activeSession.id : 'No active session'}
              </div>
            </div>

            <div>
              <label className={`block ${textSecondary} text-sm font-mono mb-2`}>Duration (minutes)</label>
              <input
                type="number"
                value={activeSession ? Math.round(activeSession.durationSeconds / 60) : newSessionDuration}
                onChange={(e) => !activeSession && setNewSessionDuration(parseInt(e.target.value) || 60)}
                disabled={!!activeSession}
                className={`w-full ${inputDarkBg} border ${inputBorder} rounded px-4 py-3 font-mono focus:outline-none focus:border-[#0f8] disabled:opacity-50`}
              />
            </div>

            <div>
              <span className={`${textSecondary} text-sm font-mono`}>Status: </span>
              <span className={`${activeSession ? (activeSession.status === 'In progress' ? 'text-[#0f8]' : 'text-yellow-500') : 'text-gray-500'} font-mono font-bold text-sm`}>
                {activeSession ? activeSession.status.toUpperCase() : 'INACTIVE'}
              </span>
            </div>
          </div>
        </div>

        <div className={`${bgCard} border ${borderColor} rounded-lg p-6 shadow-lg`}>
          <h3 className={`text-xl font-mono ${textTertiary} mb-6`}>Controls</h3>

          <div className="space-y-4">
            {!activeSession ? (
              <div className={`text-center py-6 ${textSecondary} font-mono text-sm border border-dashed ${borderColor} rounded`}>
                <p className="mb-2">No session currently available.</p>
                <a href="/admin/settings" className="text-[#0f8] hover:underline">Go to Settings to create one.</a>
              </div>
            ) : (
              <>
                {activeSession.status === 'Not started' && (
                  <button
                    onClick={() => handleUpdateStatus('In progress')}
                    disabled={loading}
                    className={`w-full ${buttonPrimary} px-6 py-3 rounded font-mono flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Session
                  </button>
                )}

                {/* Pause Implementation: Schema doesn't support 'paused' yet, so omitting or mapping to Pending? 
                    User asked to pause. Let's assume for now we can switch back to 'pending' (Not started) for pause.
                */}
                {activeSession.status === 'In progress' && (
                  <button
                    onClick={() => handleUpdateStatus('Not started')}
                    disabled={loading}
                    className={`w-full ${buttonSecondary} px-6 py-3 rounded font-mono flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pause (Set to Pending)
                  </button>
                )}

                <button
                  onClick={() => handleUpdateStatus('Finished')}
                  disabled={loading}
                  className={`w-full ${buttonSecondary} px-6 py-3 rounded font-mono flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Stop / Finish Session
                </button>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <svg className={`w-8 h-8 ${titleColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className={`text-3xl font-mono font-bold ${titleColor}`}>{activeSession ? activeSession.participants : 0}</span>
          </div>
          <p className={`${textSecondary} text-sm`}>Active Players</p>
        </div>

        <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <svg className={`w-8 h-8 ${titleColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-3xl font-mono font-bold ${textSecondary}`}>--</span>
          </div>
          <p className={`${textSecondary} text-sm`}>Minutes Left</p>
        </div>

        <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <svg className={`w-8 h-8 ${titleColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            <span className={`text-3xl font-mono font-bold ${titleColor}`}>0</span>
          </div>
          <p className={`${textSecondary} text-sm`}>Total Flags</p>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className={`${bgCard} border ${borderColor} rounded-lg p-6 shadow-lg`}>
        <h3 className={`text-xl font-mono ${textTertiary} mb-4`}>Recent Sessions</h3>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSessionFilter('All')}
            className={`${sessionFilter === 'All' ? buttonPrimary + ' shadow-[0px_0px_10px_0px_rgba(0,255,136,0.3)]' : buttonSecondary} px-4 py-2 rounded text-sm font-mono transition-all`}
          >
            All
          </button>
          <button
            onClick={() => setSessionFilter('Not started')}
            className={`${sessionFilter === 'Not started' ? buttonPrimary + ' shadow-[0px_0px_10px_0px_rgba(0,255,136,0.3)]' : buttonSecondary} px-4 py-2 rounded text-sm font-mono transition-all`}
          >
            Not started
          </button>
          <button
            onClick={() => setSessionFilter('In progress')}
            className={`${sessionFilter === 'In progress' ? buttonPrimary + ' shadow-[0px_0px_10px_0px_rgba(0,255,136,0.3)]' : buttonSecondary} px-4 py-2 rounded text-sm font-mono transition-all`}
          >
            In progress
          </button>
          <button
            onClick={() => setSessionFilter('Finished')}
            className={`${sessionFilter === 'Finished' ? buttonPrimary + ' shadow-[0px_0px_10px_0px_rgba(0,255,136,0.3)]' : buttonSecondary} px-4 py-2 rounded text-sm font-mono transition-all`}
          >
            Finished
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${borderColor}`}>
                <th className={`text-left py-3 px-4 text-sm font-mono ${textSecondary}`}>Session ID</th>
                <th className={`text-left py-3 px-4 text-sm font-mono ${textSecondary}`}>Status</th>
                <th className={`text-left py-3 px-4 text-sm font-mono ${textSecondary}`}>Start Time</th>
                <th className={`text-left py-3 px-4 text-sm font-mono ${textSecondary}`}>End Time</th>
                <th className={`text-left py-3 px-4 text-sm font-mono ${textSecondary}`}>Participants</th>
                <th className={`text-left py-3 px-4 text-sm font-mono ${textSecondary}`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session, idx) => (
                  <SessionRow
                    key={idx}
                    session={session}
                    isDark={isDark}
                    borderColor={borderColor}
                    hoverRow={hoverRow}
                    textTertiary={textTertiary}
                    titleColor={titleColor}
                    onViewDetails={(id) => router.push(`/admin/sessions/${id}`)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <p className={`${textSecondary} font-mono`}>
                      {sessions.length === 0 ? 'No sessions yet' : `No ${sessionFilter.toLowerCase()} sessions`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
