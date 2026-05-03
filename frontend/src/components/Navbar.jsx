import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/AuthContext';
import DefaultAvatar from './DefaultAvatar';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);

    // Close menus on route change
    useEffect(() => {
        setMobileOpen(false);
        setProfileOpen(false);
    }, [location.pathname]);

    // Close profile dropdown on outside click
    useEffect(() => {
        if (!profileOpen) return undefined;
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [profileOpen]);

    const handleLogout = async () => {
        await logout();
        toast.info('Signed out.');
        navigate('/');
    };

    const getNavLinks = () => {
        const common = [{ to: '/', label: 'Home', exact: true }];
        if (!user) return common;

        const byRole = {
            'Standard User': [{ to: '/bookings', label: 'My Bookings' }],
            'Organizer': [
                { to: '/my-events', label: 'My Events' },
                { to: '/my-events/analytics', label: 'Analytics' },
            ],
            'System Admin': [
                { to: '/admin/events', label: 'Manage Events' },
                { to: '/admin/users', label: 'Manage Users' },
            ],
        };

        return [...common, ...(byRole[user.role] || [])];
    };

    const navLinks = getNavLinks();

    return (
        <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 sm:h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-lg">E</span>
                        </div>
                        <span className="text-xl font-bold gradient-text hidden sm:inline">EventHub</span>
                    </Link>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.exact}
                                className={({ isActive }) =>
                                    `relative font-medium transition-colors duration-200 ${
                                        isActive
                                            ? 'text-indigo-600'
                                            : 'text-slate-600 hover:text-indigo-600'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {link.label}
                                        {isActive && (
                                            <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>

                    {/* Right side: auth buttons or profile dropdown */}
                    <div className="flex items-center gap-3">
                        {!user ? (
                            <>
                                <Link
                                    to="/login"
                                    className="hidden sm:inline px-3 py-2 text-slate-700 font-semibold hover:text-indigo-600 transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
                            </>
                        ) : (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen((s) => !s)}
                                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 hover:bg-slate-50 transition"
                                >
                                    <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100">
                                        <DefaultAvatar name={user.name} profilePicture={user.profilePicture} />
                                    </div>
                                    <span className="hidden sm:inline text-sm font-semibold text-slate-700">
                                        {user.name?.split(' ')[0] || 'User'}
                                    </span>
                                    <ChevronDown size={16} className="text-slate-400" />
                                </button>

                                {profileOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl py-2 z-50">
                                        <div className="px-4 pb-2 border-b border-slate-200">
                                            <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                            <p className="mt-1 inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-50 text-indigo-700">
                                                {user.role}
                                            </p>
                                        </div>
                                        <Link
                                            to="/profile"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <UserIcon size={16} /> My profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                        >
                                            <LogOut size={16} /> Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile burger */}
                        <button
                            onClick={() => setMobileOpen((s) => !s)}
                            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-slate-200 py-3 space-y-1">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.exact}
                                className={({ isActive }) =>
                                    `block px-3 py-2 rounded-lg text-base font-medium ${
                                        isActive
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-700 hover:bg-slate-50'
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                        {!user && (
                            <Link
                                to="/login"
                                className="block px-3 py-2 rounded-lg text-base font-semibold text-indigo-600 hover:bg-slate-50"
                            >
                                Sign in
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
