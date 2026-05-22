
import axios from 'axios';

const api = axios.create({
    // Fallback based on environment
    baseURL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://mpesaconnect.co.ke/api' : 'http://localhost:2365/api'),
});

api.interceptors.request.use((config) => {
    const posToken = localStorage.getItem('posToken');
    const token = localStorage.getItem('token');

    // Priority: POS Token > Standard Token
    if (posToken) {
        config.headers.Authorization = `Bearer ${posToken}`;
    } else if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
