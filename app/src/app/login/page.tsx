'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const { isDark, classes } = useTheme()
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { bgMain, bgCard, borderColor, titleColor, textSecondary, textTertiary, inputBg, inputBorder, buttonPrimary } = classes
    const inputDarkBg = isDark ? 'bg-[#0a0a0f] text-white' : `${inputBg} ${textTertiary}`

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            const data = await res.json()

            if (data.success) {
                // Store token
                localStorage.setItem('admin_token', data.token)
                localStorage.setItem('admin_username', data.admin.username)
                // Redirect
                router.push('/admin')
            } else {
                setError(data.error || 'Login failed')
            }
        } catch (err) {
            setError('Connection failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`min-h-screen ${bgMain} flex items-center justify-center px-4`}>
            <div className={`${bgCard} border ${borderColor} rounded-lg p-8 w-full max-w-md shadow-[0px_0px_50px_0px_rgba(0,255,136,0.1)]`}>
                <div className="text-center mb-8">
                    <h1 className={`text-3xl font-mono ${titleColor} mb-2`}>System Access</h1>
                    <p className={`${textSecondary} font-mono text-sm`}>Restricted Area. Authorized Personnel Only.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded text-sm font-mono">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className={`block ${textSecondary} text-sm font-mono mb-2`}>Identity</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full ${inputDarkBg} border ${inputBorder} rounded px-4 py-3 font-mono focus:outline-none focus:border-[#0f8] transition-colors`}
                            placeholder="Username"
                        />
                    </div>

                    <div>
                        <label className={`block ${textSecondary} text-sm font-mono mb-2`}>Secret Key</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full ${inputDarkBg} border ${inputBorder} rounded px-4 py-3 font-mono focus:outline-none focus:border-[#0f8] transition-colors`}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full ${buttonPrimary} py-3 rounded font-mono font-bold hover:shadow-[0px_0px_20px_0px_rgba(0,255,136,0.4)] transition-all active:scale-95 disabled:opacity-50`}
                    >
                        {loading ? 'Authenticating...' : 'Authenticate'}
                    </button>
                </form>
            </div>
        </div>
    )
}
