import axios from "axios";

const API_URL = "http://localhost:3000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true // Enable sending cookies with requests
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors here
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const eventService = {
  // Public endpoints
  getAllEvents: () => api.get("/events"),
  getEventById: (id) => api.get(`/events/${id}`),
  
  // Organizer endpoints
  createEvent: (data) => api.post("/events", data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  getMyEvents: () => api.get("/events/users/my-events"),
  getMyEventAnalytics: () => api.get("/events/users/analytics"),
  
  // Admin endpoints
  getAllEventsAdmin: () => api.get("/events/all"),
  approveEvent: (id) => api.put(`/events/${id}/approve`),
  declineEvent: (id) => api.put(`/events/${id}/decline`),
};

export const bookingService = {
  createBooking: (data) => api.post("/bookings", data),
  getMyBookings: () => api.get("/users/bookings"),
  cancelBooking: (bookingId) => api.delete(`/bookings/${bookingId}`),
  getBookingsForEvent: (eventId) => api.get(`/bookings/event/${eventId}`),
};

export default api;