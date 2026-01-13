'use client'

import Header from '@/components/Header'
import { useTheme } from '@/contexts/ThemeContext'
import { memo, useMemo, useState, useEffect } from 'react'
import { API } from '@/lib/api'

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
  const [statusFilter, setStatusFilter] = useState<'All' | 'In progress' | 'Finished'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [session, setSession] = useState<{ id: string, code: string, status: string, endTime: Date | null } | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])

  // Use pre-computed classes from context
  const { bgMain, bgCard, borderColor, titleColor, textPrimary, textSecondary, textTertiary, inputBg, inputBorder, buttonSecondary, hoverRow } = classes
  const inputDarkBg = isDark ? 'bg-[#0a0a0f] text-white' : `${inputBg} ${textTertiary}`
  const placeholderColor = isDark ? 'placeholder-[#808090]' : 'placeholder-[#9ca3af]'

  const fetchSessionAndLeaderboard = async () => {
    try {
      // 1. Get active session
      const sessionRes = await fetch(API.sessions());
      const sessionData = await sessionRes.json();

      if (!sessionData.success || !Array.isArray(sessionData.sessions)) return;

      // Find active or pending session
      const active = sessionData.sessions.find((s: any) => s.session_status === 'active' || s.session_status === 'pending');

      if (active) {
        setSession({
          id: active.id,
          code: active.sessionCode || active.id,
          status: active.session_status,
          endTime: active.destroyedAt ? new Date(active.destroyedAt) : null // Should calculate based on duration if active
        });

        // 2. Get leaderboard
        const lbRes = await fetch(API.sessionLeaderboard(active.id));
        const lbData = await lbRes.json();

        if (lbData.success && Array.isArray(lbData.leaderboard)) {
          const mapped = lbData.leaderboard.map((p: any, idx: number) => ({
            place: idx + 1,
            name: p.displayName || `Player ${idx + 1}`,
            status: p.containerStatus || 'Active',
            time: '-',
            points: parseInt(p.totalScore) || 0
          }));
          setParticipants(mapped);
        }
      } else {
        setSession(null);
        setParticipants([]);
      }

    } catch (e) {
      console.error("Failed to fetch leaderboard data", e);
    }
  }

  // Poll for updates
  useEffect(() => {
    fetchSessionAndLeaderboard();
    const interval = setInterval(fetchSessionAndLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter participants based on status and search query
  const filteredParticipants = useMemo(() => {
    return participants.filter(participant => {
      // Status filter
      const statusMatch = statusFilter === 'All' ||
        (statusFilter === 'Finished' && participant.status === 'Finished') ||
        (statusFilter === 'In progress' && participant.status !== 'Finished')

      // Search filter
      const searchMatch = searchQuery === '' ||
        participant.name.toLowerCase().includes(searchQuery.toLowerCase())

      return statusMatch && searchMatch
    })
  }, [statusFilter, searchQuery, participants])

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
              <p className={`text-2xl ${textTertiary} font-mono`}>{session ? `#${session.code}` : '--'}</p>
            </div>
            <div>
              <p className={`text-xs ${textSecondary} font-mono mb-2`}>STATUS</p>
              <div className={`inline-block ${session ? (session.status === 'active' ? (isDark ? 'bg-[rgba(1,255,136,0.2)] text-[#0f8]' : 'bg-[#d1fae5] text-[#065f46]') : 'bg-yellow-500/20 text-yellow-500') : (isDark ? 'bg-[rgba(128,128,144,0.2)]' : 'bg-[#e5e7eb]')} px-3 py-1 rounded-full text-sm font-mono`}>
                {session ? session.status.toUpperCase() : 'No active session'}
              </div>
            </div>
            <div>
              <p className={`text-xs ${textSecondary} font-mono mb-2`}>REMAINING TIME</p>
              <p className={`text-2xl ${textTertiary} font-mono`}>--</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={`${bgCard} border ${borderColor} rounded-lg p-6 mb-6 shadow-[0px_0px_20px_0px_rgba(0,255,136,0.1)]`}>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('All')}
                className={`${statusFilter === 'All' ? 'bg-[#0f8] text-[#0a0a0f] shadow-[0px_0px_10px_0px_rgba(0,255,136,0.3)]' : `${buttonSecondary} ${textTertiary}`} px-4 py-2 rounded font-mono text-sm transition-all`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('In progress')}
                className={`${statusFilter === 'In progress' ? 'bg-[#0f8] text-[#0a0a0f] shadow-[0px_0px_10px_0px_rgba(0,255,136,0.3)]' : `${buttonSecondary} ${textTertiary}`} px-4 py-2 rounded font-mono text-sm transition-all`}
              >
                In progress
              </button>
              <button
                onClick={() => setStatusFilter('Finished')}
                className={`${statusFilter === 'Finished' ? 'bg-[#0f8] text-[#0a0a0f] shadow-[0px_0px_10px_0px_rgba(0,255,136,0.3)]' : `${buttonSecondary} ${textTertiary}`} px-4 py-2 rounded font-mono text-sm transition-all`}
              >
                Finished
              </button>
            </div>
            <div className="relative w-80">
              <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${inputDarkBg} border ${inputBorder} rounded pl-10 pr-4 py-2 ${placeholderColor} focus:outline-none focus:border-[#0f8] transition-colors`}
              />
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className={`${bgCard} border ${borderColor} rounded-lg overflow-hidden shadow-[0px_0px_20px_0px_rgba(0,255,136,0.1)]`}>
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
                {filteredParticipants.length > 0 ? (
                  filteredParticipants.map((participant) => (
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
                        <p>{participants.length === 0 ? 'No participants yet' : 'No matching participants'}</p>
                        <p className="text-sm mt-1 opacity-75">
                          {participants.length === 0 ? 'Waiting for players to join the session' : 'Try adjusting your filters'}
                        </p>
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
