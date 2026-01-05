'use client'

import Header from '@/components/Header'
import { useTheme } from '@/contexts/ThemeContext'
import { useState, memo } from 'react'

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
  const [sessionId, setSessionId] = useState('')
  const [displayName, setDisplayName] = useState('')

  const { bgMain, bgCard, borderColor, titleColor, textPrimary, textSecondary, textTertiary, inputBg, inputBorder } = classes
  const placeholderColor = isDark ? 'text-[#808090] placeholder-[#808090]' : 'text-[#9ca3af] placeholder-[#9ca3af]'

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

            <form className="space-y-6">
              <div>
                <label className={`block ${textTertiary} font-mono mb-2`}>Session ID</label>
                <input
                  type="text"
                  placeholder="Example: 123456"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className={`w-full ${inputBg} border ${inputBorder} rounded px-4 py-3 ${placeholderColor} focus:outline-none focus:border-[#0f8] transition-colors font-mono`}
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
                  className={`w-full ${inputBg} border ${inputBorder} rounded px-4 py-3 ${placeholderColor} focus:outline-none focus:border-[#0f8] transition-colors font-mono`}
                />
                <p className={`${textSecondary} text-sm mt-2`}>Use a unique gamer name for the leaderboard</p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0f8] text-[#0a0a0f] px-8 py-4 rounded font-mono text-lg shadow-[0px_0px_15px_0px_rgba(0,255,136,0.2)] hover:shadow-[0px_0px_25px_0px_rgba(0,255,136,0.3)] transition-shadow"
              >
                Join session
              </button>
            </form>
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
              
              <div className={`${inputBg} border ${borderColor} rounded-lg p-8 text-center`}>
                <svg className={`w-10 h-10 mx-auto mb-3 ${textSecondary} opacity-50`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className={`${textSecondary} font-mono`}>No active sessions</p>
                <p className={`${textSecondary} font-mono text-sm mt-1 opacity-75`}>Sessions will appear here when available</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
