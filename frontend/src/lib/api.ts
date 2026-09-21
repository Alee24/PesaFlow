
import axios from 'axios';

const api = axios.create({
    // Fallback based on environment
    baseURL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://mpesaconnect.co.ke/api' : 'http://localhost:2365/api'),
});

/**
 * Checks if a JWT token has expired based on its payload exp timestamp.
 */
function isJwtExpired(token: string | null): boolean {
    if (!token) return true;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false; // Not a standard JWT, let backend validate
        const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);
        if (typeof payload.exp === 'number') {
            // Add a 15-second safety buffer
            return Date.now() >= (payload.exp * 1000 - 15000);
        }
        return false;
    } catch {
        return false;
    }
}

// Request Interceptor: Route-aware and expiration-safe token injection
api.interceptors.request.use((config) => {
    if (typeof window === 'undefined') return config;

    const isPosRoute = window.location.pathname.startsWith('/pos');
    let posToken = localStorage.getItem('posToken');
    let token = localStorage.getItem('token');

    // Automatically prune expired tokens from storage
    if (posToken && isJwtExpired(posToken)) {
        localStorage.removeItem('posToken');
        localStorage.removeItem('posUser');
        posToken = null;
    }
    if (token && isJwtExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        token = null;
    }

    let activeToken: string | null = null;

    if (isPosRoute) {
        // In POS: prioritize posToken, fall back to merchant token
        activeToken = posToken || token;
    } else {
        // Outside POS (Dashboard, Analytics, Direct Payment, M-Pesa Services, etc.):
        // ALWAYS prioritize standard merchant token. Never let an old POS token hijack dashboard API calls.
        activeToken = token || posToken;
    }

    if (activeToken) {
        config.headers.Authorization = `Bearer ${activeToken}`;
    }

    return config;
});

// Response Interceptor: Gracefully handle expired or invalid sessions
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== 'undefined' && error.response) {
            const status = error.response.status;
            const errorMsg = String(error.response.data?.error || '').toLowerCase();
            const isAuthError = status === 401 || (status === 403 && (errorMsg.includes('token') || errorMsg.includes('session')));

            if (isAuthError) {
                const currentPath = window.location.pathname;
                const isPosRoute = currentPath.startsWith('/pos');
                const isLoginPage = currentPath.includes('/login') || currentPath.includes('/register');

                if (!isLoginPage) {
                    if (isPosRoute) {
                        localStorage.removeItem('posToken');
                        localStorage.removeItem('posUser');
                        window.location.href = '/pos/login';
                    } else {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/auth/login';
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;

