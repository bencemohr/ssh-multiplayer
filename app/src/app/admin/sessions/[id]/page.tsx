'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { API } from '@/lib/api'

interface LeaderboardEntry {
    playerContainer_id: string
    containerCode: string
    totalScore: number
    containerStatus: string
    participants: number
    levels_completed: number
    displayName?: string
    isFFA?: boolean
    teamLetter?: string
    player_names?: string
}

interface Event {
    container_logs_id: string
    event_type: string
    point: number
    createdAt: string
    containerCode: string
    metaData: any
}

export default function SessionDetailsPage() {
    const { isDark, classes } = useTheme()
    const params = useParams()
    const sessionId = params.id as string

    const { bgCard, textPrimary, textSecondary, textTertiary, borderColor, buttonSecondary } = classes

    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!sessionId) return

        const fetchData = async () => {
            try {
                const [lbRes, eventsRes] = await Promise.all([
                    fetch(API.sessionLeaderboard(sessionId)),
                    fetch(API.sessionEvents(sessionId))
                ])

                const lbData = await lbRes.json()
                const eventsData = await eventsRes.json()

                if (lbData.success) setLeaderboard(lbData.leaderboard)
                if (eventsData.success) setEvents(eventsData.events)

            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        // Optionally poll for updates if it's the active session, but likely this is used for historical view too.
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)

    }, [sessionId])


    if (loading) {
        return <div className={`p-8 ${textSecondary} font-mono`}>Loading session data...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-mono font-bold ${textPrimary}`}>
                    Session Details
                    <span className={`text-sm ${textSecondary} ml-3 font-normal`}>ID: {sessionId}</span>
                </h2>
                <Link href="/admin/sessions" className={`${buttonSecondary} px-4 py-2 rounded font-mono text-sm`}>
                    ← Back to Sessions
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leaderboard Column */}
                <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
                    <h3 className={`text-xl font-mono ${textTertiary} mb-4 flex items-center gap-2`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Leaderboard
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`border-b ${borderColor} text-xs font-mono uppercase tracking-wider ${textSecondary}`}>
                                    <th className="p-3">Rank</th>
                                    <th className="p-3">Player/Team</th>
                                    <th className="p-3 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {leaderboard.length === 0 ? (
                                    <tr><td colSpan={3} className={`p-4 text-center ${textSecondary} font-mono text-sm`}>No teams found.</td></tr>
                                ) : (
                                    leaderboard.map((team, idx) => (
                                        <tr key={team.playerContainer_id} className="hover:bg-white/5 transition-colors font-mono">
                                            <td className={`p-3 ${textTertiary} font-bold`}>#{idx + 1}</td>
                                            <td className={`p-3 ${textPrimary}`}>{team.displayName || team.containerCode}</td>
                                            <td className={`p-3 text-right font-bold text-[#0f8]`}>{team.totalScore}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Events Feed Column */}
                <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
                    <h3 className={`text-xl font-mono ${textTertiary} mb-4 flex items-center gap-2`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Event Log
                    </h3>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {events.length === 0 ? (
                            <div className={`p-4 text-center ${textSecondary} font-mono text-sm border ${borderColor} rounded border-dashed`}>
                                No events recorded yet.
                            </div>
                        ) : (
                            events.map((event) => (
                                <div key={event.container_logs_id} className={`p-3 rounded border ${borderColor} bg-black/20 font-mono text-sm`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[#0f8] font-bold text-xs uppercase tracking-wider">
                                            {event.event_type.replace(/_/g, ' ')}
                                        </span>
                                        <span className={`${textSecondary} text-xs`}>
                                            {new Date(event.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className={`${textPrimary}`}>
                                        <span className="text-[#0f8] font-bold text-xs mr-2">[{event.containerCode}]</span>
                                        {event.point > 0 ? '+' : ''}{event.point} pts
                                    </div>
                                    {event.metaData && (
                                        <div className={`text-xs ${textSecondary} mt-1 truncate`}>
                                            {JSON.stringify(event.metaData)}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
