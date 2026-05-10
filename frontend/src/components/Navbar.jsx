import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/AuthContext';
import DefaultAvatar from './DefaultAvatar';
import AuthModal from './AuthModal';
import { LogoMark } from './Logo';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [authMode, setAuthMode] = useState(null); // 'login' | 'register' | 'forgot' | null
    const profileRef = useRef(null);

    useEffect(() => {
        setMobileOpen(false);
        setProfileOpen(false);
    }, [location.pathname]);

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

    const baseLinks = [
        // "Events" should also light up on event detail and booking pages, since the user is still browsing.
        { to: '/', label: 'Events', exact: true, activePrefixes: ['/events', '/booking'] },
        { to: '/outlets', label: 'Outlets' },
        { to: '/saved', label: 'Saved' },
        { to: '/contact', label: 'Contact & Support' },
    ];

    const isLinkActive = (link, isActiveFromNavLink) => {
        if (isActiveFromNavLink) return true;
        const prefixes = link.activePrefixes || [];
        return prefixes.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'));
    };

    const roleLinks = !user
        ? []
        : {
              'Standard User': [{ to: '/bookings', label: 'My Bookings' }],
              Organizer: [
                  { to: '/my-events', label: 'My Events', exact: true },
                  { to: '/my-events/analytics', label: 'Analytics' },
              ],
              'System Admin': [
                  { to: '/admin/events', label: 'Manage Events' },
                  { to: '/admin/users', label: 'Manage Users' },
                  { to: '/admin/outlets', label: 'Manage Outlets' },
                  { to: '/admin/contact', label: 'Support Inbox' },
              ],
          }[user.role] || [];

    const navLinks = [...baseLinks, ...roleLinks];

    return (
        <>
            <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="container-page">
                    <div className="flex items-center justify-between h-16 sm:h-[72px]">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition">
                            <LogoMark size={36} />
                            <span className="text-xl font-extrabold tracking-tight leading-none text-navy-600">
                                event<span className="text-primary-500">Hub</span>
                            </span>
                        </Link>

                        {/* Desktop nav */}
                        <div className="hidden md:flex items-center gap-7">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    end={link.exact}
                                    className={({ isActive }) =>
                                        `relative text-sm font-medium transition-colors ${
                                            isLinkActive(link, isActive)
                                                ? 'text-primary-600'
                                                : 'text-slate-700 hover:text-primary-600'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {link.label}
                                            {isLinkActive(link, isActive) && (
                                                <span className="absolute -bottom-[22px] left-0 right-0 h-0.5 rounded-full bg-primary-500" />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>

                        {/* Right cluster */}
                        <div className="flex items-center gap-2">
                            {!user ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode('login')}
                                        className="hidden sm:inline-flex btn btn-ghost btn-sm"
                                    >
                                        Sign in
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode('register')}
                                        className="btn btn-primary btn-sm"
                                    >
                                        Register
                                    </button>
                                </>
                            ) : (
                                <div className="relative" ref={profileRef}>
                                    <button
                                        onClick={() => setProfileOpen((s) => !s)}
                                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 hover:border-primary-300 transition"
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
                                        <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white shadow-card-hover py-2 z-50 animate-fade-in">
                                            <div className="px-4 pb-2 border-b border-slate-200">
                                                <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                                <p className="mt-1 inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary-50 text-primary-700">
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
                        <div className="md:hidden border-t border-slate-200 py-3 space-y-1 animate-fade-in">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    end={link.exact}
                                    className={({ isActive }) =>
                                        `block px-3 py-2 rounded-lg text-base font-medium ${
                                            isLinkActive(link, isActive)
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-slate-700 hover:bg-slate-50'
                                        }`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                            {!user && (
                                <button
                                    type="button"
                                    onClick={() => setAuthMode('login')}
                                    className="block w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-primary-600 hover:bg-slate-50"
                                >
                                    Sign in
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSwitch={setAuthMode} />
        </>
    );
};

export default Navbar;
