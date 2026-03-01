import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    if (user && user.token) {
                        config.headers.Authorization = `Bearer ${user.token}`;
                    }
                }
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
