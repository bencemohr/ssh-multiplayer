'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, memo, useMemo } from 'react'

// Data will be fetched from database
const recentSessions: { id: string; status: string; start: string; end: string; participants: number }[] = []

// Memoized session row component
const SessionRow = memo(function SessionRow({ 
  session, 
  isDark, 
  borderColor, 
  hoverRow, 
  textTertiary, 
  titleColor 
}: { 
  session: typeof recentSessions[0]
  isDark: boolean
  borderColor: string
  hoverRow: string
  textTertiary: string
  titleColor: string
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
        <button className={`${titleColor} hover:underline text-sm font-mono flex items-center gap-1`}>
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
  // TODO: Fetch session status from database. If no active session or fetch fails, set to 'INACTIVE' or 'FALSE'
  const [status, setStatus] = useState('ACTIVE')
  const [sessionFilter, setSessionFilter] = useState<'All' | 'Not started' | 'In progress' | 'Finished'>('All')

  const { bgCard, borderColor, titleColor, textPrimary, textSecondary, textTertiary, inputBg, inputBorder, buttonPrimary, buttonSecondary, hoverRow } = classes
  const inputDarkBg = isDark ? 'bg-[#0a0a0f] text-white' : `${inputBg} ${textTertiary}`

  // Filter recent sessions based on status
  const filteredSessions = useMemo(() => {
    if (sessionFilter === 'All') return recentSessions
    return recentSessions.filter(session => session.status === sessionFilter)
  }, [sessionFilter])

  return (
    <div className="space-y-8">
      {/* Session Control */}
      <div className="grid grid-cols-2 gap-6">
        <div className={`${bgCard} border ${borderColor} rounded-lg p-6 shadow-lg`}>
          <h3 className={`text-xl font-mono ${textTertiary} mb-6`}>Session Control</h3>
          
          <div className="space-y-6">
            <div>
              <label className={`block ${textSecondary} text-sm font-mono mb-2`}>Session ID</label>
              <div className={`${inputBg} border ${borderColor} rounded px-4 py-3 ${textTertiary} font-mono`}>
                #123456
              </div>
            </div>

            <div>
              <label className={`block ${textSecondary} text-sm font-mono mb-2`}>Duration (minutes)</label>
              <input
                type="number"
                defaultValue={60}
                className={`w-full ${inputDarkBg} border ${inputBorder} rounded px-4 py-3 font-mono focus:outline-none focus:border-[#0f8]`}
              />
            </div>

            <div>
              <span className={`${textSecondary} text-sm font-mono`}>Status: </span>
              <span className={`${status === 'ACTIVE' ? 'text-[#0f8]' : 'text-red-500'} font-mono font-bold text-sm`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className={`${bgCard} border ${borderColor} rounded-lg p-6 shadow-lg`}>
          <h3 className={`text-xl font-mono ${textTertiary} mb-6`}>Controls</h3>
          
          <div className="space-y-4">
            <button className={`w-full ${buttonPrimary} px-6 py-3 rounded font-mono flex items-center justify-center gap-2 transition-all active:scale-95`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Session
            </button>
            
            <button className={`w-full ${buttonSecondary} px-6 py-3 rounded font-mono flex items-center justify-center gap-2 transition-all active:scale-95`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pause
            </button>
            
            <button className={`w-full ${buttonSecondary} px-6 py-3 rounded font-mono flex items-center justify-center gap-2 transition-all active:scale-95`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop Session
            </button>
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
            <span className={`text-3xl font-mono font-bold ${titleColor}`}>0</span>
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
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <p className={`${textSecondary} font-mono`}>
                      {recentSessions.length === 0 ? 'No sessions yet' : `No ${sessionFilter.toLowerCase()} sessions`}
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
