
import axios from 'axios';

const api = axios.create({
    // Fallback based on environment
    baseURL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.mpesaconnect.co.ke/api' : 'http://localhost:5454/api'),
});

api.interceptors.request.use((config) => {
    const posToken = localStorage.getItem('posToken');
    const token = localStorage.getItem('token');

    const isPosPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/pos');

    // If on POS path, prioritize POS Token. 
    // Otherwise, use standard Token (Admin/Merchant session)
    if (isPosPath && posToken) {
        config.headers.Authorization = `Bearer ${posToken}`;
    } else if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else if (posToken) {
        // Fallback for cases like refreshing /pos
        config.headers.Authorization = `Bearer ${posToken}`;
    }
    return config;
});

export default api;
