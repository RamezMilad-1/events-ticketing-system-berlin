import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Dashboard from "./pages/Dashboard";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import ProtectedRoute from "./auth/ProtectedRoutes";
import Unauthorized from "./pages/Unauthorized";
import Layout from "./components/layout";
import Profile from "./pages/Profile";
import AdminUsersPage from "./pages/AdminUsersPage";
import EventList from "./components/EventList";
import EventDetails from "./components/EventDetails";
import Booking from "./pages/Booking";
import BookingSuccess from "./pages/BookingSuccess";
import MyBookings from "./pages/MyBookings";
import MyEvents from "./pages/MyEvents";
import EditEvent from "./pages/EditEvent";
import CreateEvent from "./pages/CreateEvent";
import EventAnalytics from "./pages/EventAnalytics";
import AdminEventsPage from "./pages/AdminEventsPage";

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Public Home Route with Layout */}
          <Route path="/" element={<Layout />}>
            {/* Index Route - Public EventList */}
            <Route index element={<EventList />} />
            
            {/* Protected Routes */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute allowedRoles={["Standard User", "Organizer", "System Admin"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* Profile Route */}
            <Route
              path="profile"
              element={
                <ProtectedRoute allowedRoles={["Standard User", "Organizer", "System Admin"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            {/* Event Details and Booking Routes - Public but require auth for booking */}
            <Route path="events/:eventId" element={<EventDetails />} />
            <Route
              path="booking/:eventId"
              element={
                <ProtectedRoute allowedRoles={["Standard User"]}>
                  <Booking />
                </ProtectedRoute>
              }
            />
            <Route
              path="booking-success"
              element={
                <ProtectedRoute allowedRoles={["Standard User"]}>
                  <BookingSuccess />
                </ProtectedRoute>
              }
            />
            {/* My Bookings Route */}
            <Route
              path="my-bookings"
              element={
                <ProtectedRoute allowedRoles={["Standard User"]}>
                  <MyBookings />
                </ProtectedRoute>
              }
            />

            {/* My Events Route - Only for Organizers */}
            <Route
              path="my-events"
              element={
                <ProtectedRoute allowedRoles={["Organizer"]}>
                  <MyEvents />
                </ProtectedRoute>
              }
            />

            {/* Create Event Route - Only for Organizers */}
            <Route
              path="create-event"
              element={
                <ProtectedRoute allowedRoles={["Organizer"]}>
                  <CreateEvent />
                </ProtectedRoute>
              }
            />

            {/* Edit Event Route - Only for Organizers */}
            <Route
              path="edit-event/:eventId"
              element={
                <ProtectedRoute allowedRoles={["Organizer"]}>
                  <EditEvent />
                </ProtectedRoute>
              }
            />

            {/* Event Analytics Route - Only for Organizers */}
            <Route
              path="event-analytics/:eventId"
              element={
                <ProtectedRoute allowedRoles={["Organizer"]}>
                  <EventAnalytics />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route path="admin">
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={["System Admin"]}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="events"
                element={
                  <ProtectedRoute allowedRoles={["System Admin"]}>
                    <AdminEventsPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>

          {/* Wildcard Route */}
          <Route
            path="*"
            element={<Navigate to={"/"} replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;