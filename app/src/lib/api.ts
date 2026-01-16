/**
 * API Configuration Utility
 * 
 * Dynamically determines the API base URL based on the browser's current location.
 * This enables zero-config LAN access - players just visit http://<host-ip>:3000/
 * and the API calls automatically use http://<host-ip>:3001/
 */

const API_PORT = 3001;

/**
 * Get the base URL for API calls.
 * Uses the current hostname from the browser, which works for both:
 * - localhost development
 * - LAN access (when accessed via IP like 192.168.1.x)
 */
export function getApiBaseUrl(): string {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `http://${hostname}:${API_PORT}`;
    }
    
    // Fallback for server-side rendering
    // If running in Docker (Next.js server-side), 'localhost' won't work.
    // We should use the docker-compose service name 'api' if possible,
    // or fallback to localhost for local non-docker dev.
    if (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV) {
         return `http://api:${API_PORT}`;
    }

    return `http://localhost:${API_PORT}`;
}

/**
 * Build a full API endpoint URL
 * @param path - API path (e.g., '/api/sessions' or '/api/auth/login')
 */
export function apiUrl(path: string): string {
    const base = getApiBaseUrl();
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
}

// Pre-built common endpoints for convenience
export const API = {
    sessions: () => apiUrl('/api/sessions'),
    sessionsActive: () => apiUrl('/api/sessions/active'),
    session: (id: string) => apiUrl(`/api/sessions/${id}`),
    sessionLeaderboard: (id: string) => apiUrl(`/api/sessions/${id}/leaderboard`),
    sessionEvents: (id: string) => apiUrl(`/api/sessions/${id}/events`),
    sessionStatus: (id: string) => apiUrl(`/api/sessions/${id}/status`),
    createSession: () => apiUrl('/api/session'),
    join: () => apiUrl('/api/join'),
    authLogin: () => apiUrl('/api/auth/login'),
};
