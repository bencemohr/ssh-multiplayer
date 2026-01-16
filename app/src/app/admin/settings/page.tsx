'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { API } from '@/lib/api'

export default function AdminSettingsPage() {
  const { isDark, classes } = useTheme()
  const router = useRouter()

  const { bgCard, borderColor, titleColor, textPrimary, textSecondary, textTertiary, inputBg, inputBorder, buttonPrimary, buttonSecondary } = classes
  const inputDarkBg = isDark ? 'bg-[#0a0a0f] text-white' : `${inputBg} ${textTertiary}`

  // Session Config
  const [duration, setDuration] = useState(60)
  const [maxPlayers, setMaxPlayers] = useState(20)
  const [isTeamMode, setIsTeamMode] = useState(true)
  const [teamCount, setTeamCount] = useState(4)

  // Scoring Config
  const [pointsPerFlag, setPointsPerFlag] = useState(500)
  const [hintPenalty, setHintPenalty] = useState(100)
  const [firstBloodBonus, setFirstBloodBonus] = useState(250)
  const [loading, setLoading] = useState(false)

  // Danger zone
  const [clearSessionsConfirm, setClearSessionsConfirm] = useState('')
  const [showClearSessionsInput, setShowClearSessionsInput] = useState(false)

  // Adjust team count if max players changes in Team Mode to stay logical
  useEffect(() => {
    if (isTeamMode && teamCount > maxPlayers) {
      setTeamCount(maxPlayers > 0 ? maxPlayers : 1)
    }
  }, [maxPlayers, isTeamMode, teamCount])

  const handleCreateSession = async () => {
    setLoading(true)
    try {
      // Logic: If Team Mode, use teamCount. If FFA, teams = maxPlayers (1 container per player)
      const finalTeamsCount = isTeamMode ? teamCount : maxPlayers
      // Calculate max players per team (use Ceil to ensure everyone fits)
      const finalMaxPlayersPerTeam = isTeamMode ? Math.ceil(maxPlayers / teamCount) : 1

      const res = await fetch(API.createSession(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationSecond: duration * 60,
          maxPlayers: maxPlayers,
          teamsCount: finalTeamsCount,
          maxPlayersPerTeam: finalMaxPlayersPerTeam
        })
      })
      const data = await res.json()

      if (data.success) {
        alert('Session created successfully!')
        router.push('/admin') // Redirect to overview to see the new session
      } else {
        alert('Failed to create session: ' + (data.error || 'Unknown error'))
      }

    } catch (e) {
      console.error(e)
      alert('Error creating session')
    } finally {
      setLoading(false)
    }
  }

  const handleClearSessions = async () => {
    if (clearSessionsConfirm === 'clear-all-sessions') {
      try {
        setLoading(true)

        // Call the delete all sessions endpoint
        const res = await fetch(API.sessions(), {
          method: 'DELETE'
        })
        const data = await res.json()

        if (data.success) {
          alert('All session history has been cleared.')
          setClearSessionsConfirm('')
          setShowClearSessionsInput(false)
        } else {
          throw new Error(data.error || 'Failed to clear sessions')
        }
      } catch (e) {
        console.error(e)
        alert('Failed to clear sessions')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Session Launcher */}
      <div className={`${bgCard} border ${borderColor} rounded-lg p-6 shadow-lg`}>
        <h3 className={`text-xl font-mono ${textTertiary} mb-6 flex items-center gap-2`}>
          <svg className={`w-6 h-6 ${titleColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Session Launcher
        </h3>

        <p className={`${textSecondary} font-mono text-sm mb-6`}>
          Configure and launch a new game session.
        </p>

        {/* Game Mode Selection */}
        <div className="mb-6">
          <label className={`block ${textSecondary} text-sm font-mono mb-2`}>Game Mode</label>
          <div className="flex gap-4">
            <button
              onClick={() => setIsTeamMode(true)}
              className={`flex-1 py-3 px-4 rounded border font-mono transition-all ${isTeamMode
                ? `border-[#0f8] ${isDark ? 'bg-[rgba(0,255,136,0.1)] text-[#0f8]' : 'bg-[#d1fae5] text-[#065f46]'}`
                : `${borderColor} ${inputBg} ${textTertiary} opacity-70 hover:opacity-100`
                }`}
            >
              <div className="font-bold mb-1">Team Based</div>
              <div className="text-xs opacity-75">Fixed number of teams (containers) sharing resources.</div>
            </button>
            <button
              onClick={() => setIsTeamMode(false)}
              className={`flex-1 py-3 px-4 rounded border font-mono transition-all ${!isTeamMode
                ? `border-[#0f8] ${isDark ? 'bg-[rgba(0,255,136,0.1)] text-[#0f8]' : 'bg-[#d1fae5] text-[#065f46]'}`
                : `${borderColor} ${inputBg} ${textTertiary} opacity-70 hover:opacity-100`
                }`}
            >
              <div className="font-bold mb-1">Free For All</div>
              <div className="text-xs opacity-75">One container per player (Resource Intensive).</div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className={`block ${textSecondary} text-sm font-mono mb-2`}>
              Session Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className={`w-full ${inputDarkBg} border ${inputBorder} rounded px-4 py-3 font-mono focus:outline-none focus:border-[#0f8]`}
            />
          </div>

          <div>
            <label className={`block ${textSecondary} text-sm font-mono mb-2`}>
              Max Players
            </label>
            <input
              type="number"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 0)}
              className={`w-full ${inputDarkBg} border ${inputBorder} rounded px-4 py-3 font-mono focus:outline-none focus:border-[#0f8]`}
            />
          </div>

          <div className={`col-span-1 md:col-span-2 transition-all duration-200 ${!isTeamMode ? 'opacity-40 grayscale' : ''}`}>
            <label className={`block ${textSecondary} text-sm font-mono mb-2`}>
              Number of Teams (Containers)
            </label>
            <input
              type="number"
              value={isTeamMode ? teamCount : maxPlayers}
              disabled={!isTeamMode}
              min={1}
              max={maxPlayers}
              onChange={(e) => setTeamCount(parseInt(e.target.value) || 1)}
              className={`w-full ${inputDarkBg} border ${inputBorder} rounded px-4 py-3 font-mono focus:outline-none focus:border-[#0f8] disabled:cursor-not-allowed`}
            />
            <p className={`text-xs ${textSecondary} mt-2 font-mono`}>
              {isTeamMode
                ? `Approx. ${Math.ceil(maxPlayers / (teamCount || 1))} players per team.`
                : 'One container per player (1-to-1)'}
            </p>
          </div>
        </div>

        <h4 className={`text-lg font-mono ${textTertiary} mb-4 flex items-center gap-2 border-t ${borderColor} pt-4`}>
          Scoring Configuration
          <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded ml-2 uppercase font-bold tracking-wider">
            In Development
          </span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 opacity-60 grayscale pointer-events-none select-none">
          <div>
            <label className={`block ${textSecondary} text-sm font-mono mb-2`}>
              Points per Flag
            </label>
            <input
              type="number"
              value={pointsPerFlag}
              disabled
              onChange={(e) => setPointsPerFlag(parseInt(e.target.value) || 0)}
              className={`w-full ${inputDarkBg} border ${inputBorder} rounded px-4 py-3 font-mono focus:outline-none focus:border-[#0f8] cursor-not-allowed`}
            />
          </div>

          <div>
            <label className={`block ${textSecondary} text-sm font-mono mb-2`}>
              Hint Penalty
            </label>
            <input
              type="number"
              value={hintPenalty}
              disabled
              onChange={(e) => setHintPenalty(parseInt(e.target.value) || 0)}
              className={`w-full ${inputDarkBg} border ${inputBorder} rounded px-4 py-3 font-mono focus:outline-none focus:border-[#0f8] cursor-not-allowed`}
            />
          </div>

          <div>
            <label className={`block ${textSecondary} text-sm font-mono mb-2`}>
              First Blood Bonus
            </label>
            <input
              type="number"
              value={firstBloodBonus}
              disabled
              onChange={(e) => setFirstBloodBonus(parseInt(e.target.value) || 0)}
              className={`w-full ${inputDarkBg} border ${inputBorder} rounded px-4 py-3 font-mono focus:outline-none focus:border-[#0f8] cursor-not-allowed`}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => {
              setDuration(60)
              setMaxPlayers(20)
              setIsTeamMode(true)
              setTeamCount(4)
              setPointsPerFlag(500)
              setHintPenalty(100)
              setFirstBloodBonus(250)
            }}
            className={`px-6 py-3 rounded font-mono transition-colors text-sm hover:opacity-80 ${isDark
              ? 'bg-gray-600 text-white hover:bg-gray-500'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
          >
            Revert to Defaults
          </button>

          <button
            onClick={handleCreateSession}
            disabled={loading}
            className={`${buttonPrimary} px-8 py-3 rounded font-mono transition-shadow flex items-center gap-2 hover:shadow-[0px_0px_20px_0px_rgba(0,255,136,0.4)] disabled:opacity-50`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {loading ? 'Creating...' : 'Create New Session'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className={`${isDark ? 'bg-[rgba(220,38,38,0.1)]' : 'bg-[#fee2e2]'} border ${isDark ? 'border-[rgba(220,38,38,0.3)]' : 'border-[#fecaca]'} rounded-lg p-6`}>
        <h3 className={`text-xl font-mono ${isDark ? 'text-red-400' : 'text-red-700'} mb-4 flex items-center gap-2`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Danger Zone
        </h3>
        <p className={`${isDark ? 'text-red-300' : 'text-red-600'} font-mono text-sm mb-4`}>
          Manage global system state. Proceed with caution.
        </p>

        <div className="space-y-4">
          {/* Clear All Sessions */}
          <div className={`${inputBg} border ${borderColor} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`${textTertiary} font-mono font-bold text-sm`}>Stop/Clear All Sessions</h4>
                <p className={`${textSecondary} font-mono text-xs mt-1`}>Mark active session as finished and clear all session history.</p>
              </div>
              <button
                onClick={() => setShowClearSessionsInput(true)}
                className={`${isDark ? 'bg-red-900/50 hover:bg-red-900' : 'bg-red-600 hover:bg-red-700'} text-white px-4 py-2 rounded font-mono transition-colors text-sm`}
              >
                Clear All Sessions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Sessions Modal */}
      {showClearSessionsInput && (
        <div className="fixed top-0 left-0 right-0 bottom-0 !m-0 !mt-0 bg-black/50 flex items-center justify-center z-50" onClick={() => {
          setShowClearSessionsInput(false)
          setClearSessionsConfirm('')
        }}>
          <div className={`${isDark ? 'bg-[#0a0a0f]' : 'bg-white'} border ${borderColor} rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className={`text-lg font-mono font-bold ${textTertiary} mb-1`}>Confirm Clear All Sessions</h3>
                <p className={`${textSecondary} font-mono text-sm`}>
                  This will stop any active session and delete all session history.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className={`${textSecondary} text-sm font-mono mb-2`}>
                Type <span className="text-red-500 font-bold">clear-all-sessions</span> to confirm:
              </p>
              <input
                type="text"
                value={clearSessionsConfirm}
                onChange={(e) => setClearSessionsConfirm(e.target.value.replace(/\s/g, '-').toLowerCase())}
                placeholder="clear-all-sessions"
                autoFocus
                className={`w-full ${inputDarkBg} border ${inputBorder} rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-red-500 placeholder-[#808090]`}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowClearSessionsInput(false)
                  setClearSessionsConfirm('')
                }}
                className={`${buttonSecondary} px-4 py-2 rounded font-mono text-sm`}
              >
                Cancel
              </button>
              <button
                onClick={handleClearSessions}
                disabled={clearSessionsConfirm !== 'clear-all-sessions'}
                className={`px-4 py-2 rounded font-mono text-sm transition-colors ${clearSessionsConfirm === 'clear-all-sessions'
                  ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                  }`}
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
