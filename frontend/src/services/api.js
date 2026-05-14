import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// Token storage helpers — backend returns the JWT in the login response body so we
// can send it via Authorization: Bearer. This works across origins even when the
// browser drops cross-site cookies (Safari, Chrome with third-party cookies off),
// which is the case on Render where backend and frontend live on different
// *.onrender.com subdomains.
const TOKEN_KEY = 'eh_token';
export const tokenStore = {
    get() {
        try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
    },
    set(token) {
        try { if (token) localStorage.setItem(TOKEN_KEY, token); } catch {}
    },
    clear() {
        try { localStorage.removeItem(TOKEN_KEY); } catch {}
    },
};

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = tokenStore.get();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Endpoints that are safe to fail with 401 silently (e.g. initial profile probe on public pages)
const SILENT_401_PATHS = ['/users/profile'];

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';

        // Don't hard-redirect for the initial profile fetch — public users browsing /
        // shouldn't be bounced to /login.
        if (status === 401 && !SILENT_401_PATHS.some((p) => url.endsWith(p))) {
            // For real 401s on protected actions, let the caller handle the toast/redirect.
        }

        return Promise.reject(error);
    }
);

// ----------------------------- Auth -----------------------------
export const authService = {
    login: (credentials) => api.post('/login', credentials),
    register: (data) => api.post('/register', data),
    logout: () => api.post('/logout'),

    requestPasswordReset: (email) => api.post('/forgetPassword/request', { email }),
    verifyPasswordResetOtp: (email, otp) => api.post('/forgetPassword/verify', { email, otp }),
    resetPassword: (payload) => api.put('/forgetPassword', payload),
};

// ----------------------------- Users ----------------------------
export const userService = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    deleteOwnProfile: () => api.delete('/users/profile'),
    changePassword: (data) => api.put('/users/changePassword', data),

    // Admin
    getAllUsers: () => api.get('/users'),
    getUser: (id) => api.get(`/users/${id}`),
    updateUserRole: (id, role) => api.put(`/users/${id}`, { role }),
    deleteUser: (id) => api.delete(`/users/${id}`),

    // Standard user
    getMyBookings: () => api.get('/users/bookings'),

    // Organizer
    getMyEvents: () => api.get('/users/events'),
    getMyEventAnalytics: () => api.get('/users/events/analytics'),
};

// ----------------------------- Events ---------------------------
export const eventService = {
    // Public
    getAllEvents: () => api.get('/events'),
    getEventById: (id) => api.get(`/events/${id}`),

    // Organizer
    createEvent: (data) => api.post('/events', data),
    updateEvent: (id, data) => api.put(`/events/${id}`, data),
    deleteEvent: (id) => api.delete(`/events/${id}`),

    // Admin
    getAllEventsAdmin: () => api.get('/events/all'),
    updateEventStatus: (id, status) => api.put(`/events/${id}/status`, { status }),
    approveEvent: (id) => api.put(`/events/${id}/status`, { status: 'approved' }),
    declineEvent: (id) => api.put(`/events/${id}/status`, { status: 'declined' }),
};

// ---------------------------- Bookings --------------------------
export const bookingService = {
    createBooking: (data) => api.post('/bookings', data),
    getBookingById: (id) => api.get(`/bookings/${id}`),
    cancelBooking: (id) => api.delete(`/bookings/${id}`),

    // Used by theater seat picker
    getBookingsForEvent: (eventId) => api.get(`/bookings/event/${eventId}`),
};

// ---------------------------- Outlets ---------------------------
export const outletService = {
    list: () => api.get('/outlets'),
    get: (id) => api.get(`/outlets/${id}`),

    // Admin
    create: (data) => api.post('/outlets', data),
    update: (id, data) => api.put(`/outlets/${id}`, data),
    remove: (id) => api.delete(`/outlets/${id}`),
};

// ---------------------------- Contact ---------------------------
export const contactService = {
    // Public submission
    submit: (data) => api.post('/contact', data),

    // Admin
    list: () => api.get('/contact'),
    updateStatus: (id, status) => api.patch(`/contact/${id}`, { status }),
    remove: (id) => api.delete(`/contact/${id}`),
};

export default api;
