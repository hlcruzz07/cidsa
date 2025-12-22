import axios from 'axios';

const apiService = axios.create({
    baseURL: import.meta.env.APP_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// Attach CSRF token from meta tag

apiService.interceptors.request.use((config) => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]');
    if (csrfToken) {
        const token = csrfToken.getAttribute('content');

        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
        }
    }

    return config;
});

export default apiService;
