'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, memo, useMemo, useEffect } from 'react'
import { API } from '@/lib/api'

interface Player {
  playerContainer_id: string
  containerCode: string
  totalScore: number
  place?: number
  containerStatus: string
  participants: number
}

// Memoized player row component
const PlayerRow = memo(function PlayerRow({
  player,
  index,
  isDark,
  borderColor,
  hoverRow,
  textSecondary,
  textTertiary,
  titleColor
}: {
  player: Player
  index: number
  isDark: boolean
  borderColor: string
  hoverRow: string
  textSecondary: string
  textTertiary: string
  titleColor: string
}) {
  const place = index + 1
  const placeColor = useMemo(() => {
    if (place === 1) return 'text-[#FFD700]'
    if (place === 2) return 'text-[#C0C0C0]'
    if (place === 3) return 'text-[#CD7F32]'
    return textTertiary
  }, [place, textTertiary])

  return (
    <tr className={`border-b ${borderColor} ${hoverRow} transition-colors`}>
      <td className={`py-4 px-6 font-mono font-bold text-lg ${placeColor}`}>
        #{place}
      </td>
      <td className={`py-4 px-6 font-mono ${textTertiary}`}>{player.containerCode}</td>
      <td className="py-4 px-6">
        <span className={`inline-flex items-center gap-2 ${player.containerStatus === 'running' || player.containerStatus === 'active' // assuming status values
          ? isDark ? 'bg-[rgba(0,255,136,0.2)]' : 'bg-[#d1fae5]'
          : isDark ? 'bg-[rgba(128,128,144,0.2)]' : 'bg-[#e5e7eb]'
          } ${player.containerStatus === 'running' || player.containerStatus === 'active'
            ? isDark ? 'text-[#0f8]' : 'text-[#065f46]'
            : textSecondary
          } px-3 py-1 rounded-full text-xs font-mono`}>
          <span className={`w-2 h-2 rounded-full ${player.containerStatus === 'running' || player.containerStatus === 'active' ? 'bg-[#0f8]' : 'bg-gray-400'}`}></span>
          {player.containerStatus}
        </span>
      </td>
      <td className={`py-4 px-6 font-mono ${textTertiary}`}>{player.participants} Connected</td>
      <td className={`py-4 px-6 font-mono ${titleColor}`}>{player.totalScore}</td>
      <td className="py-4 px-6">
        <div className="flex gap-2">
          {/* <button className={`${titleColor} hover:underline text-sm font-mono`}>View</button> */}
          <button className="text-red-400 hover:text-red-300 hover:underline text-sm font-mono opacity-50 cursor-not-allowed" title="Coming soon">Remove</button>
        </div>
      </td>
    </tr>
  )
})

export default function AdminPlayersPage() {
  const { isDark, classes } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  const { bgCard, borderColor, titleColor, textSecondary, textTertiary, inputBg, inputBorder, buttonSecondary, hoverRow } = classes
  const inputDarkBg = isDark ? 'bg-[#0a0a0f] text-white' : `${inputBg} ${textTertiary}`

  const fetchPlayers = async () => {
    try {
      setLoading(true)
      // First get sessions to find active one
      const sessRes = await fetch(API.sessions())
      const sessData = await sessRes.json()

      if (sessData.success && sessData.sessions && sessData.sessions.length > 0) {
        // Assume the most recent or active session
        // Filter for active or just take the first one for now as per previous logic
        const activeSession = sessData.sessions[0] // Simplified, might want to find 'running'

        if (activeSession) {
          const lbRes = await fetch(API.sessionLeaderboard(activeSession.id))
          const lbData = await lbRes.json()
          if (lbData.success) {
            setPlayers(lbData.leaderboard)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch players', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlayers()
    // Poll every 10s
    const interval = setInterval(fetchPlayers, 10000)
    return () => clearInterval(interval)
  }, [])

  const filteredPlayers = players.filter(p =>
    p.containerCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleExport = () => {
    if (players.length === 0) return

    const headers = ['Place', 'Container Code', 'Status', 'Participants', 'Score']
    const rows = players.map((p, i) => [
      i + 1,
      p.containerCode,
      p.containerStatus,
      p.participants,
      p.totalScore
    ])

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `players_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <div className={`flex items-center gap-2 ${inputDarkBg} border ${inputBorder} rounded px-4 py-2 flex-1 max-w-md`}>
          <svg className={`w-5 h-5 ${textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent font-mono focus:outline-none flex-1 placeholder-[#808090]"
          />
        </div>

        <div className="flex gap-2">
          {/* Removed Add Player button */}
          <button
            onClick={handleExport}
            className={`${buttonSecondary} px-4 py-2 rounded font-mono transition-colors flex items-center gap-2`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Players Table */}
      <div className={`${bgCard} border ${borderColor} rounded-lg shadow-lg overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${borderColor} ${isDark ? 'bg-[#0f0f15]' : 'bg-[#f9fafb]'}`}>
                <th className={`text-left py-4 px-6 text-sm font-mono ${textSecondary}`}>Place</th>
                <th className={`text-left py-4 px-6 text-sm font-mono ${textSecondary}`}>Container Code</th>
                <th className={`text-left py-4 px-6 text-sm font-mono ${textSecondary}`}>Status</th>
                <th className={`text-left py-4 px-6 text-sm font-mono ${textSecondary}`}>Users</th>
                <th className={`text-left py-4 px-6 text-sm font-mono ${textSecondary}`}>Points</th>
                <th className={`text-left py-4 px-6 text-sm font-mono ${textSecondary}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player, idx) => (
                  <PlayerRow
                    key={player.playerContainer_id || idx}
                    player={player}
                    index={idx}
                    isDark={isDark}
                    borderColor={borderColor}
                    hoverRow={hoverRow}
                    textSecondary={textSecondary}
                    textTertiary={textTertiary}
                    titleColor={titleColor}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className={`${textSecondary} font-mono`}>
                      <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p>{loading ? 'Loading players...' : 'No players registered'}</p>
                      <p className="text-sm mt-1 opacity-75">Players will appear here when they join a session</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className={`${bgCard} border ${borderColor} rounded-lg p-4`}>
          <p className={`${textSecondary} text-xs font-mono mb-2`}>Total Players</p>
          <p className={`text-2xl font-mono font-bold ${titleColor}`}>{players.length}</p>
        </div>
        <div className={`${bgCard} border ${borderColor} rounded-lg p-4`}>
          <p className={`${textSecondary} text-xs font-mono mb-2`}>Active Containers</p>
          <p className={`text-2xl font-mono font-bold ${titleColor}`}>
            {players.filter(p => p.containerStatus !== 'stopped').length}
          </p>
        </div>
        <div className={`${bgCard} border ${borderColor} rounded-lg p-4`}>
          <p className={`${textSecondary} text-xs font-mono mb-2`}>Avg Points</p>
          <p className={`text-2xl font-mono font-bold ${titleColor}`}>
            {players.length > 0 ? Math.round(players.reduce((acc, p) => acc + p.totalScore, 0) / players.length) : 0}
          </p>
        </div>
        <div className={`${bgCard} border ${borderColor} rounded-lg p-4`}>
          <p className={`${textSecondary} text-xs font-mono mb-2`}>Top Score</p>
          <p className={`text-2xl font-mono font-bold text-[#FFD700]`}>
            {players.length > 0 ? Math.max(...players.map(p => p.totalScore)) : 0}
          </p>
        </div>
      </div>
    </div>
  )
}
