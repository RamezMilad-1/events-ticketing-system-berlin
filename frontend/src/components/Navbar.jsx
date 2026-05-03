import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const getNavLinks = () => {
        if (!user) {
            return [
                { to: '/', label: 'Home' },
            ];
        }

        const commonLinks = [
            { to: '/', label: 'Home' },
            { to: '/profile', label: 'Profile' },
        ];

        const roleSpecificLinks = {
            'Standard User': [
                { to: '/my-bookings', label: 'My Bookings' },
            ],
            'Organizer': [
                { to: '/my-events', label: 'My Events' },
                { to: '/create-event', label: 'Create Event' },
            ],
            'System Admin': [
                { to: '/admin/users', label: 'Manage Users' },
                { to: '/admin/events', label: 'Manage Events' },
            ],
        };

        return [...commonLinks, ...(roleSpecificLinks[user?.role] || [])];
    };

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-lg backdrop-blur-lg bg-white/95 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link 
                        to="/" 
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">E</span>
                        </div>
                        <span className="text-xl font-bold gradient-text hidden sm:inline">EventHub</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {getNavLinks().map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className="text-slate-600 hover:text-indigo-600 font-medium transition-colors duration-200 relative group"
                            >
                                {link.label}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-blue-600 group-hover:w-full transition-all duration-300"></span>
                            </Link>
                        ))}
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3">
                        {!user ? (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-slate-700 font-semibold hover:text-indigo-600 transition-colors duration-200"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-primary btn-sm"
                                >
                                    Register
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-600 hidden sm:inline">
                                    {user.name}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-primary btn-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 