'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState } from 'react'

export default function AdminSettingsPage() {
  const { isDark, classes } = useTheme()

  const { bgCard, borderColor, titleColor, textPrimary, textSecondary, textTertiary, inputBg, inputBorder, buttonPrimary, buttonSecondary } = classes

  const [settings, setSettings] = useState({
    sessionDuration: 60,
    maxPlayers: 20,
    hintPenalty: 100,
    autoStart: false,
    allowSpectators: true,
    enableChat: true,
    recordSessions: true,
    containerTimeout: 120,
    pointsPerFlag: 500,
    firstBloodBonus: 250,
  })

  const handleSave = () => {
    console.log('Saving settings:', settings)
    alert('Settings saved successfully!')
  }

  return (
    <div className="space-y-6">
      {/* Session Settings */}
      <div className={`${bgCard} border ${borderColor} rounded-lg p-6 shadow-lg`}>
        <h3 className={`text-xl font-mono ${textTertiary} mb-6 flex items-center gap-2`}>
          <svg className={`w-6 h-6 ${titleColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Session Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block ${textSecondary} text-sm font-mono mb-2`}>
              Default Session Duration (minutes)
            </label>
            <input
              type="number"
              value={settings.sessionDuration}
              onChange={(e) => setSettings({...settings, sessionDuration: parseInt(e.target.value)})}
              className={`w-full ${inputBg} border ${inputBorder} rounded px-4 py-3 ${textTertiary} font-mono focus:outline-none focus:border-[#0f8]`}
            />
          </div>

          <div>
            <label className={`block ${textSecondary} text-sm font-mono mb-2`}>
              Maximum Players per Session
            </label>
            <input
              type="number"
              value={settings.maxPlayers}
              onChange={(e) => setSettings({...settings, maxPlayers: parseInt(e.target.value)})}
              className={`w-full ${inputBg} border ${inputBorder} rounded px-4 py-3 ${textTertiary} font-mono focus:outline-none focus:border-[#0f8]`}
            />
          </div>

          <div>
            <label className={`block ${textSecondary} text-sm font-mono mb-2`}>
              Container Timeout (seconds)
            </label>
            <input
              type="number"
              value={settings.containerTimeout}
              onChange={(e) => setSettings({...settings, containerTimeout: parseInt(e.target.value)})}
              className={`w-full ${inputBg} border ${inputBorder} rounded px-4 py-3 ${textTertiary} font-mono focus:outline-none focus:border-[#0f8]`}
            />
            <p className={`${textSecondary} text-xs font-mono mt-1`}>
              Time before inactive containers are terminated
            </p>
          </div>

          <div>
            <label className={`block ${textSecondary} text-sm font-mono mb-2`}>
              Hint Penalty (points)
            </label>
            <input
              type="number"
              value={settings.hintPenalty}
              onChange={(e) => setSettings({...settings, hintPenalty: parseInt(e.target.value)})}
              className={`w-full ${inputBg} border ${inputBorder} rounded px-4 py-3 ${textTertiary} font-mono focus:outline-none focus:border-[#0f8]`}
            />
          </div>
        </div>
      </div>

      {/* Scoring Settings */}
      <div className={`${bgCard} border ${borderColor} rounded-lg p-6 shadow-lg`}>
        <h3 className={`text-xl font-mono ${textTertiary} mb-6 flex items-center gap-2`}>
          <svg className={`w-6 h-6 ${titleColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Scoring System
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block ${textSecondary} text-sm font-mono mb-2`}>
              Points per Flag
            </label>
            <input
              type="number"
              value={settings.pointsPerFlag}
              onChange={(e) => setSettings({...settings, pointsPerFlag: parseInt(e.target.value)})}
              className={`w-full ${inputBg} border ${inputBorder} rounded px-4 py-3 ${textTertiary} font-mono focus:outline-none focus:border-[#0f8]`}
            />
          </div>

          <div>
            <label className={`block ${textSecondary} text-sm font-mono mb-2`}>
              First Blood Bonus
            </label>
            <input
              type="number"
              value={settings.firstBloodBonus}
              onChange={(e) => setSettings({...settings, firstBloodBonus: parseInt(e.target.value)})}
              className={`w-full ${inputBg} border ${inputBorder} rounded px-4 py-3 ${textTertiary} font-mono focus:outline-none focus:border-[#0f8]`}
            />
            <p className={`${textSecondary} text-xs font-mono mt-1`}>
              Bonus points for first player to capture a flag
            </p>
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className={`${bgCard} border ${borderColor} rounded-lg p-6 shadow-lg`}>
        <h3 className={`text-xl font-mono ${textTertiary} mb-6 flex items-center gap-2`}>
          <svg className={`w-6 h-6 ${titleColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Features
        </h3>

        <div className="space-y-4">
          {[
            { key: 'autoStart', label: 'Auto-start sessions when minimum players join', description: 'Automatically begin session when enough players are ready' },
            { key: 'allowSpectators', label: 'Allow spectators', description: 'Let users observe sessions without participating' },
            { key: 'enableChat', label: 'Enable in-game chat', description: 'Allow players to communicate during sessions' },
            { key: 'recordSessions', label: 'Record session data', description: 'Save detailed logs and replays of all sessions' },
          ].map((feature) => (
            <div key={feature.key} className={`flex items-start gap-4 p-4 ${inputBg} border ${inputBorder} rounded`}>
              <button
                onClick={() => setSettings({...settings, [feature.key]: !settings[feature.key as keyof typeof settings]})}
                className={`flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                  settings[feature.key as keyof typeof settings] ? 'bg-[#0f8]' : isDark ? 'bg-[#2a2a38]' : 'bg-[#d1d5db]'
                } relative`}
              >
                <span className={`absolute top-0.5 ${
                  settings[feature.key as keyof typeof settings] ? 'right-0.5' : 'left-0.5'
                } w-5 h-5 bg-white rounded-full transition-all shadow`}></span>
              </button>
              <div className="flex-1">
                <p className={`${textTertiary} font-mono text-sm font-bold`}>{feature.label}</p>
                <p className={`${textSecondary} font-mono text-xs mt-1`}>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Actions */}
      <div className="flex justify-end gap-4">
        <button className={`${buttonSecondary} px-8 py-3 rounded font-mono transition-colors`}>
          Reset to Defaults
        </button>
        <button 
          onClick={handleSave}
          className={`${buttonPrimary} px-8 py-3 rounded font-mono transition-shadow flex items-center gap-2`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Settings
        </button>
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
          These actions are irreversible. Please proceed with caution.
        </p>
        <div className="flex gap-4">
          <button className={`${isDark ? 'bg-red-900/50 hover:bg-red-900' : 'bg-red-600 hover:bg-red-700'} text-white px-6 py-2 rounded font-mono transition-colors`}>
            Clear All Sessions
          </button>
          <button className={`${isDark ? 'bg-red-900/50 hover:bg-red-900' : 'bg-red-600 hover:bg-red-700'} text-white px-6 py-2 rounded font-mono transition-colors`}>
            Reset Database
          </button>
        </div>
      </div>
    </div>
  )
}
