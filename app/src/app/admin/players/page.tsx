'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, memo, useMemo } from 'react'

// Data will be fetched from database
const playersData: { name: string; container: string; ip: string; points: number; place: number }[] = []

// Memoized player row component
const PlayerRow = memo(function PlayerRow({ 
  player, 
  isDark, 
  borderColor, 
  hoverRow, 
  textSecondary, 
  textTertiary, 
  titleColor 
}: { 
  player: typeof playersData[0]
  isDark: boolean
  borderColor: string
  hoverRow: string
  textSecondary: string
  textTertiary: string
  titleColor: string
}) {
  const placeColor = useMemo(() => {
    if (player.place === 1) return 'text-[#FFD700]'
    if (player.place === 2) return 'text-[#C0C0C0]'
    if (player.place === 3) return 'text-[#CD7F32]'
    return textTertiary
  }, [player.place, textTertiary])

  return (
    <tr className={`border-b ${borderColor} ${hoverRow} transition-colors`}>
      <td className={`py-4 px-6 font-mono font-bold text-lg ${placeColor}`}>
        #{player.place}
      </td>
      <td className={`py-4 px-6 font-mono ${textTertiary}`}>{player.name}</td>
      <td className="py-4 px-6">
        <span className={`inline-flex items-center gap-2 ${
          player.container === 'Running' 
            ? isDark ? 'bg-[rgba(0,255,136,0.2)]' : 'bg-[#d1fae5]'
            : isDark ? 'bg-[rgba(128,128,144,0.2)]' : 'bg-[#e5e7eb]'
        } ${
          player.container === 'Running'
            ? isDark ? 'text-[#0f8]' : 'text-[#065f46]'
            : textSecondary
        } px-3 py-1 rounded-full text-xs font-mono`}>
          <span className={`w-2 h-2 rounded-full ${player.container === 'Running' ? 'bg-[#0f8]' : 'bg-gray-400'}`}></span>
          {player.container}
        </span>
      </td>
      <td className={`py-4 px-6 font-mono ${textTertiary}`}>{player.ip}</td>
      <td className={`py-4 px-6 font-mono ${titleColor}`}>{player.points}</td>
      <td className="py-4 px-6">
        <div className="flex gap-2">
          <button className={`${titleColor} hover:underline text-sm font-mono`}>View</button>
          <button className="text-[#00d9ff] hover:underline text-sm font-mono">Reset</button>
          <button className="text-red-400 hover:underline text-sm font-mono">Remove</button>
        </div>
      </td>
    </tr>
  )
})

export default function AdminPlayersPage() {
  const { isDark, classes } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')

  const { bgCard, borderColor, titleColor, textSecondary, textTertiary, inputBg, inputBorder, buttonPrimary, buttonSecondary, hoverRow } = classes
  const inputDarkBg = isDark ? 'bg-[#0a0a0f] text-white' : `${inputBg} ${textTertiary}`

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
          <button className={`${buttonPrimary} px-4 py-2 rounded font-mono flex items-center gap-2 transition-shadow`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Player
          </button>
          <button className={`${buttonSecondary} px-4 py-2 rounded font-mono transition-colors`}>
            Export
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
                <th className={`text-left py-4 px-6 text-sm font-mono ${textSecondary}`}>Name</th>
                <th className={`text-left py-4 px-6 text-sm font-mono ${textSecondary}`}>Container</th>
                <th className={`text-left py-4 px-6 text-sm font-mono ${textSecondary}`}>IP Address</th>
                <th className={`text-left py-4 px-6 text-sm font-mono ${textSecondary}`}>Points</th>
                <th className={`text-left py-4 px-6 text-sm font-mono ${textSecondary}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {playersData.length > 0 ? (
                playersData.map((player, idx) => (
                  <PlayerRow
                    key={idx}
                    player={player}
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
                      <p>No players registered</p>
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
          <p className={`text-2xl font-mono font-bold ${titleColor}`}>{playersData.length}</p>
        </div>
        <div className={`${bgCard} border ${borderColor} rounded-lg p-4`}>
          <p className={`${textSecondary} text-xs font-mono mb-2`}>Active Containers</p>
          <p className={`text-2xl font-mono font-bold ${titleColor}`}>
            {playersData.filter(p => p.container === 'Running').length}
          </p>
        </div>
        <div className={`${bgCard} border ${borderColor} rounded-lg p-4`}>
          <p className={`${textSecondary} text-xs font-mono mb-2`}>Avg Points</p>
          <p className={`text-2xl font-mono font-bold ${titleColor}`}>
            {playersData.length > 0 ? Math.round(playersData.reduce((acc, p) => acc + p.points, 0) / playersData.length) : 0}
          </p>
        </div>
        <div className={`${bgCard} border ${borderColor} rounded-lg p-4`}>
          <p className={`${textSecondary} text-xs font-mono mb-2`}>Top Score</p>
          <p className={`text-2xl font-mono font-bold text-[#FFD700]`}>
            {playersData.length > 0 ? Math.max(...playersData.map(p => p.points)) : 0}
          </p>
        </div>
      </div>
    </div>
  )
}
