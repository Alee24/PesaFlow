
import axios from 'axios';

// Fallback to production API if env var is missing (prevents localhost issues on server)
baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.mpesaconnect.co.ke/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
