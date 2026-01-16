'use client'

import Header from '@/components/Header'
import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect, memo } from 'react'
import { API } from '@/lib/api'

interface ActiveSession {
  id: string
  code: number
  status: string
  maxPlayers: number
  currentPlayers: number
  teamCount: number
}

// Memoized console preview component (static content)
const ConsolePreview = memo(function ConsolePreview({ isDark, borderColor }: { isDark: boolean, borderColor: string }) {
  const consoleBg = isDark ? 'bg-[#0a0a0f]' : 'bg-[#1f2937]'
  const textColor = isDark ? 'text-[#0f8]' : 'text-[#10b981]'

  return (
    <div className={`${consoleBg} border ${borderColor} rounded p-6 font-mono text-sm`}>
      <div className={`space-y-3 ${textColor}`}>
        <div><span className={textColor}>{'>'}</span> student@honeynet:~$</div>
        <div>ssh training-server</div>
        <div>Connection established.</div>
        <div>Welcome to Honeynet SSH Training</div>
        <div>Type 'help' to list available commands.</div>
        <div className="flex items-center">
          student@training:~$
          <span className="inline-block w-2 h-4 bg-[#0f8] ml-1 animate-pulse"></span>
        </div>
      </div>
    </div>
  )
})

export default function JoinPage() {
  const { isDark, classes } = useTheme()
  const [sessionCode, setSessionCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ teamUrl: string; teamCode: number; sessionCode: number } | null>(null)

  const { bgMain, bgCard, borderColor, titleColor, textPrimary, textSecondary, textTertiary, inputBg, inputBorder } = classes
  const inputDarkBg = isDark ? 'bg-[#0a0a0f] text-white' : `${inputBg} ${textTertiary}`
  const placeholderColor = isDark ? 'placeholder-[#808090]' : 'placeholder-[#9ca3af]'

  // Fetch active sessions on mount
  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const response = await fetch(API.sessionsActive())
        const data = await response.json()
        if (data.success) {
          setActiveSessions(data.sessions)
        }
      } catch (err) {
        console.error('Failed to fetch active sessions:', err)
      }
    }

    fetchActiveSessions()
    // Refresh every 10 seconds
    const interval = setInterval(fetchActiveSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(null)
    setIsLoading(true)

    try {
      const response = await fetch(API.join(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionCode: sessionCode,
          displayName: displayName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join session')
      }

      // Fix localhost URL for LAN
      let url = data.team.url;
      if (typeof window !== 'undefined' && url && url.includes('localhost')) {
        url = url.replace('localhost', window.location.hostname);
      }

      setSuccess({
        teamUrl: url,
        teamCode: data.team.code,
        sessionCode: data.session.code
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSessionClick = (code: number) => {
    setSessionCode(code.toString())
  }

  return (
    <div className={`min-h-screen ${bgMain} ${textPrimary}`}>
      <Header />

      <main className="max-w-[1092px] mx-auto px-8 py-8">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Join Form */}
          <div className={`${bgCard} border ${borderColor} rounded-lg p-8 shadow-lg`}>
            <h2 className={`text-3xl font-mono ${titleColor} mb-4`}>Join a session</h2>
            <p className={`${textSecondary} mb-8`}>
              Enter the session code from the main screen and choose your display name to join the training.
            </p>

            {success ? (
              <div className="space-y-6">
                <div className={`${isDark ? 'bg-[rgba(0,255,136,0.1)]' : 'bg-[#d1fae5]'} border ${isDark ? 'border-[#0f8]' : 'border-[#10b981]'} rounded-lg p-6`}>
                  <h3 className={`text-xl font-mono ${isDark ? 'text-[#0f8]' : 'text-[#065f46]'} mb-2`}>
                    Successfully joined!
                  </h3>
                  <p className={`${textSecondary} mb-4`}>You have been assigned to a team.</p>
                  <div className="space-y-2">
                    <p className={`font-mono ${textTertiary}`}>
                      Team Code: <span className={titleColor}>{success.teamCode}</span>
                    </p>
                    <p className={`font-mono ${textTertiary}`}>
                      Connection URL: <span className={titleColor}>{success.teamUrl}</span>
                    </p>
                  </div>
                </div>
                {(() => {
                  const joinedSession = activeSessions.find(s => s.code === success.sessionCode);
                  const isPending = joinedSession?.status === 'pending';

                  return (
                    <a
                      href={isPending ? '#' : success.teamUrl}
                      target={isPending ? undefined : "_blank"}
                      rel={isPending ? undefined : "noopener noreferrer"}
                      onClick={(e) => isPending && e.preventDefault()}
                      className={`block w-full ${isPending ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#0f8] hover:shadow-[0px_0px_25px_0px_rgba(0,255,136,0.3)]'} text-[#0a0a0f] px-8 py-4 rounded font-mono text-lg text-center shadow-[0px_0px_15px_0px_rgba(0,255,136,0.2)] transition-all`}
                    >
                      {isPending ? 'Waiting for host to start...' : 'Open Terminal'}
                    </a>
                  );
                })()}
                <button
                  onClick={() => {
                    setSuccess(null)
                    setSessionCode('')
                    setDisplayName('')
                  }}
                  className={`w-full ${inputBg} border ${borderColor} px-8 py-3 rounded font-mono ${textSecondary} hover:border-[#0f8] transition-colors`}
                >
                  Join another session
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className={`${isDark ? 'bg-red-900/20' : 'bg-red-100'} border ${isDark ? 'border-red-500' : 'border-red-400'} rounded-lg p-4`}>
                    <p className={`font-mono text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                  </div>
                )}

                <div>
                  <label className={`block ${textTertiary} font-mono mb-2`}>Session Code</label>
                  <input
                    type="text"
                    placeholder="Example: 123456"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`w-full ${inputDarkBg} border ${inputBorder} rounded px-4 py-3 ${placeholderColor} focus:outline-none focus:border-[#0f8] transition-colors font-mono`}
                    maxLength={6}
                    required
                  />
                  <p className={`${textSecondary} text-sm mt-2`}>A 6-digit code shown on the main screen</p>
                </div>

                <div>
                  <label className={`block ${textTertiary} font-mono mb-2`}>Display Name</label>
                  <input
                    type="text"
                    placeholder="Example: alexk123"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`w-full ${inputDarkBg} border ${inputBorder} rounded px-4 py-3 ${placeholderColor} focus:outline-none focus:border-[#0f8] transition-colors font-mono`}
                    minLength={2}
                    maxLength={20}
                    required
                  />
                  <p className={`${textSecondary} text-sm mt-2`}>Use a unique gamer name for the leaderboard (2-20 characters)</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || sessionCode.length !== 6 || displayName.length < 2}
                  className="w-full bg-[#0f8] text-[#0a0a0f] px-8 py-4 rounded font-mono text-lg shadow-[0px_0px_15px_0px_rgba(0,255,136,0.2)] hover:shadow-[0px_0px_25px_0px_rgba(0,255,136,0.3)] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Joining...' : 'Join session'}
                </button>
              </form>
            )}
          </div>

          {/* Right Column - Preview and Sessions */}
          <div className="space-y-6">
            {/* Console Preview */}
            <div className={`${bgCard} border ${borderColor} rounded-lg p-8 shadow-lg`}>
              <h3 className={`text-2xl font-mono ${textTertiary} mb-4`}>Training Console Preview</h3>
              <p className={`${textSecondary} mb-6`}>
                After joining, you'll interact with the training environment through an SSH terminal interface.
              </p>

              <ConsolePreview isDark={isDark} borderColor={borderColor} />
            </div>

            {/* Active Sessions */}
            <div className={`${bgCard} border ${borderColor} rounded-lg p-6 shadow-lg`}>
              <h3 className={`text-xl font-mono ${textTertiary} mb-4`}>Active Sessions</h3>

              {activeSessions.length === 0 ? (
                <div className={`${inputBg} border ${borderColor} rounded-lg p-8 text-center`}>
                  <svg className={`w-10 h-10 mx-auto mb-3 ${textSecondary} opacity-50`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className={`${textSecondary} font-mono`}>No active sessions</p>
                  <p className={`${textSecondary} font-mono text-sm mt-1 opacity-75`}>Sessions will appear here when available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSessionClick(session.code)}
                      className={`w-full ${inputBg} border ${borderColor} rounded-lg p-4 text-left hover:border-[#0f8] transition-colors`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-mono ${titleColor} text-lg`}>Session #{session.code}</p>
                          <p className={`${textSecondary} text-sm`}>
                            {session.currentPlayers}/{session.maxPlayers} players • {session.teamCount} teams
                          </p>
                        </div>
                        <span className={`${isDark ? 'bg-[rgba(0,255,136,0.2)] text-[#0f8]' : 'bg-[#d1fae5] text-[#065f46]'} px-3 py-1 rounded-full text-xs font-mono`}>
                          {session.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
