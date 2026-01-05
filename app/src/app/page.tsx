'use client'

import Header from '@/components/Header'
import { useTheme } from '@/contexts/ThemeContext'
import { memo, useMemo } from 'react'

interface Participant {
  place: number
  name: string
  status: string
  time: string
  points: number
}

// Data will be fetched from database
const participants: Participant[] = []

// Memoized table row component
const ParticipantRow = memo(function ParticipantRow({ 
  participant, 
  isDark, 
  borderColor, 
  hoverRow, 
  textTertiary 
}: { 
  participant: Participant
  isDark: boolean
  borderColor: string
  hoverRow: string
  textTertiary: string
}) {
  const placeColor = useMemo(() => {
    if (participant.place === 1) return 'text-[#ffd700]'
    if (participant.place === 2) return 'text-[#c0c0c0]'
    if (participant.place === 3) return 'text-[#cd7f32]'
    return textTertiary
  }, [participant.place, textTertiary])

  const pointsColor = useMemo(() => {
    if (participant.place <= 3) return placeColor
    return isDark ? 'text-[#0f8]' : 'text-[#10b981]'
  }, [participant.place, placeColor, isDark])

  return (
    <tr className={`border-b ${borderColor} ${hoverRow} transition-colors`}>
      <td className={`py-4 px-4 font-mono ${placeColor}`}>{participant.place}</td>
      <td className={`py-4 px-4 font-mono ${placeColor}`}>{participant.name}</td>
      <td className="py-4 px-4">
        {participant.status === 'Finished' ? (
          <span className={`inline-block ${isDark ? 'bg-[rgba(1,255,136,0.2)]' : 'bg-[#d1fae5]'} ${isDark ? 'text-[#0f8]' : 'text-[#065f46]'} px-3 py-1 rounded-full text-xs font-mono`}>
            Finished
          </span>
        ) : (
          <span className="inline-block bg-[rgba(0,217,255,0.2)] text-[#00d9ff] px-3 py-1 rounded-full text-xs font-mono">
            {participant.status}
          </span>
        )}
      </td>
      <td className={`py-4 px-4 font-mono ${textTertiary}`}>{participant.time}</td>
      <td className={`py-4 px-4 font-mono ${pointsColor}`}>{participant.points}</td>
    </tr>
  )
})

export default function Home() {
  const { isDark, classes } = useTheme()
  
  // Use pre-computed classes from context
  const { bgMain, bgCard, borderColor, titleColor, textPrimary, textSecondary, textTertiary, inputBg, inputBorder, buttonSecondary, hoverRow } = classes
  const placeholderColor = isDark ? 'text-[#808090] placeholder-[#808090]' : 'text-[#9ca3af] placeholder-[#9ca3af]'

  return (
    <div className={`min-h-screen ${bgMain} ${textPrimary}`}>
      <Header />

      {/* Main Content */}
      <main className="max-w-[992px] mx-auto px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className={`text-3xl font-mono ${titleColor} mb-2`}>Live Leaderboard</h2>
          <p className={textSecondary}>Real-time overview of active training session performance.</p>
        </div>

        {/* Session Info */}
        <div className={`${bgCard} border ${borderColor} rounded-lg p-6 mb-6 shadow-[0px_0px_20px_0px_rgba(0,255,136,0.1)]`}>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className={`text-xs ${textSecondary} font-mono mb-2`}>SESSION ID</p>
              <p className={`text-2xl ${textTertiary} font-mono`}>--</p>
            </div>
            <div>
              <p className={`text-xs ${textSecondary} font-mono mb-2`}>STATUS</p>
              <div className={`inline-block ${isDark ? 'bg-[rgba(128,128,144,0.2)]' : 'bg-[#e5e7eb]'} ${textSecondary} px-3 py-1 rounded-full text-sm font-mono`}>
                No active session
              </div>
            </div>
            <div>
              <p className={`text-xs ${textSecondary} font-mono mb-2`}>REMAINING TIME</p>
              <p className={`text-2xl ${textTertiary} font-mono`}>--:--</p>
            </div>
          </div>
        </div>

        {/* Participants Table */}
        <div className={`${bgCard} border ${borderColor} rounded-lg p-6 shadow-[0px_0px_30px_0px_rgba(0,255,136,0.1)]`}>
          <h3 className={`text-xl font-mono ${textTertiary} mb-6`}>Session Participants</h3>
          
          {/* Search and Filters */}
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-80">
              <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name..."
                className={`w-full ${inputBg} border ${inputBorder} rounded pl-10 pr-4 py-2 ${placeholderColor} focus:outline-none focus:border-[#0f8] transition-colors`}
              />
            </div>
            <div className="flex gap-2">
              <button className="bg-[#0f8] text-[#0a0a0f] px-4 py-2 rounded font-mono text-sm shadow-[0px_0px_10px_0px_rgba(0,255,136,0.3)]">
                All
              </button>
              <button className={`${buttonSecondary} ${textTertiary} px-4 py-2 rounded font-mono text-sm transition-colors`}>
                In progress
              </button>
              <button className={`${buttonSecondary} ${textTertiary} px-4 py-2 rounded font-mono text-sm transition-colors`}>
                Finished
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${borderColor}`}>
                  <th className={`text-left py-3 px-4 text-sm font-mono font-bold ${textSecondary}`}>Place</th>
                  <th className={`text-left py-3 px-4 text-sm font-mono font-bold ${textSecondary}`}>Name</th>
                  <th className={`text-left py-3 px-4 text-sm font-mono font-bold ${textSecondary}`}>Status</th>
                  <th className={`text-left py-3 px-4 text-sm font-mono font-bold ${textSecondary}`}>Time</th>
                  <th className={`text-left py-3 px-4 text-sm font-mono font-bold ${textSecondary}`}>Points</th>
                </tr>
              </thead>
              <tbody>
                {participants.length > 0 ? (
                  participants.map((participant) => (
                    <ParticipantRow
                      key={participant.place}
                      participant={participant}
                      isDark={isDark}
                      borderColor={borderColor}
                      hoverRow={hoverRow}
                      textTertiary={textTertiary}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className={`${textSecondary} font-mono`}>
                        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p>No participants yet</p>
                        <p className="text-sm mt-1 opacity-75">Waiting for players to join the session</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
