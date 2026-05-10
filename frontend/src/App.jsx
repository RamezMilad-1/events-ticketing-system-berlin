import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoutes';

import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPassword from './components/ForgotPassword';
import EventList from './components/EventList';
import EventDetails from './components/EventDetails';

import Profile from './pages/Profile';
import Unauthorized from './pages/Unauthorized';
import Booking from './pages/Booking';
import BookingDetails from './pages/BookingDetails';
import BookingSuccess from './pages/BookingSuccess';
import MyBookings from './pages/MyBookings';
import MyEvents from './pages/MyEvents';
import EditEvent from './pages/EditEvent';
import CreateEvent from './pages/CreateEvent';
import EventAnalytics from './pages/EventAnalytics';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminOutletsPage from './pages/AdminOutletsPage';
import AdminContactPage from './pages/AdminContactPage';
import Outlets from './pages/Outlets';
import About from './pages/About';
import Contact from './pages/Contact';
import SavedEvents from './pages/SavedEvents';

const STANDARD_USER = ['Standard User'];
const ORGANIZER = ['Organizer'];
const ADMIN = ['System Admin'];
const AUTH_USERS = ['Standard User', 'Organizer', 'System Admin'];

function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <ToastContainer
                    position="top-right"
                    autoClose={3500}
                    newestOnTop
                    closeOnClick
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                />
                <Routes>
                    {/* Public routes outside Layout */}
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegisterForm />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* App routes inside Layout (Navbar + Footer) */}
                    <Route path="/" element={<Layout />}>
                        <Route index element={<EventList />} />

                        {/* Static parity pages */}
                        <Route path="outlets" element={<Outlets />} />
                        <Route path="about" element={<About />} />
                        <Route path="about-us" element={<About />} />
                        <Route path="contact" element={<Contact />} />
                        <Route path="contact-us" element={<Contact />} />
                        <Route path="saved" element={<SavedEvents />} />

                        {/* Profile (any authenticated role) */}
                        <Route
                            path="profile"
                            element={
                                <ProtectedRoute allowedRoles={AUTH_USERS}>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />

                        {/* Events */}
                        <Route path="events/:eventId" element={<EventDetails />} />

                        {/* Booking flow (Standard User) */}
                        <Route
                            path="booking/:eventId"
                            element={
                                <ProtectedRoute allowedRoles={STANDARD_USER}>
                                    <Booking />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="booking-success"
                            element={
                                <ProtectedRoute allowedRoles={STANDARD_USER}>
                                    <BookingSuccess />
                                </ProtectedRoute>
                            }
                        />

                        {/* Bookings (spec + custom paths) */}
                        <Route
                            path="bookings"
                            element={
                                <ProtectedRoute allowedRoles={STANDARD_USER}>
                                    <MyBookings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="my-bookings"
                            element={
                                <ProtectedRoute allowedRoles={STANDARD_USER}>
                                    <MyBookings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="bookings/:id"
                            element={
                                <ProtectedRoute allowedRoles={STANDARD_USER}>
                                    <BookingDetails />
                                </ProtectedRoute>
                            }
                        />

                        {/* Organizer event management (spec + custom) */}
                        <Route
                            path="my-events"
                            element={
                                <ProtectedRoute allowedRoles={ORGANIZER}>
                                    <MyEvents />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="my-events/new"
                            element={
                                <ProtectedRoute allowedRoles={ORGANIZER}>
                                    <CreateEvent />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="create-event"
                            element={
                                <ProtectedRoute allowedRoles={ORGANIZER}>
                                    <CreateEvent />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="my-events/:eventId/edit"
                            element={
                                <ProtectedRoute allowedRoles={ORGANIZER}>
                                    <EditEvent />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="edit-event/:eventId"
                            element={
                                <ProtectedRoute allowedRoles={ORGANIZER}>
                                    <EditEvent />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="my-events/analytics"
                            element={
                                <ProtectedRoute allowedRoles={ORGANIZER}>
                                    <EventAnalytics />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="event-analytics"
                            element={
                                <ProtectedRoute allowedRoles={ORGANIZER}>
                                    <EventAnalytics />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="event-analytics/:eventId"
                            element={
                                <ProtectedRoute allowedRoles={ORGANIZER}>
                                    <EventAnalytics />
                                </ProtectedRoute>
                            }
                        />

                        {/* Admin */}
                        <Route path="admin">
                            <Route
                                path="users"
                                element={
                                    <ProtectedRoute allowedRoles={ADMIN}>
                                        <AdminUsersPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="events"
                                element={
                                    <ProtectedRoute allowedRoles={ADMIN}>
                                        <AdminEventsPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="outlets"
                                element={
                                    <ProtectedRoute allowedRoles={ADMIN}>
                                        <AdminOutletsPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="contact"
                                element={
                                    <ProtectedRoute allowedRoles={ADMIN}>
                                        <AdminContactPage />
                                    </ProtectedRoute>
                                }
                            />
                        </Route>
                    </Route>

                    {/* Wildcard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
