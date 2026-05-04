import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { LogoMark } from './Logo';

/**
 * Used both as a standalone /login page and embedded inside <AuthModal />.
 *  - standalone: renders the page chrome (centred card, back link, etc.)
 *  - embedded:   renders only the form body; the modal supplies the chrome
 */
export default function LoginForm({ embedded = false, onSuccess, onSwitchToRegister, onSwitchToForgot } = {}) {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const intendedPath = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(form);
            toast.success(`Welcome back, ${user.name}!`);
            if (embedded) {
                onSuccess?.(user);
            } else {
                navigate(intendedPath, { replace: true });
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const formBody = (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <p className="text-sm text-rose-700 font-medium">{error}</p>
                </div>
            )}

            <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Email address
                </label>
                <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input"
                    required
                    autoComplete="email"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                        Password
                    </label>
                    {embedded ? (
                        <button
                            type="button"
                            onClick={onSwitchToForgot}
                            className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                        >
                            Forgot password?
                        </button>
                    ) : (
                        <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-semibold">
                            Forgot password?
                        </Link>
                    )}
                </div>
                <div className="relative">
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="input pr-11"
                        required
                        autoComplete="current-password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
                {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="pt-3 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-600">
                    Don't have an account?{' '}
                    {embedded ? (
                        <button
                            type="button"
                            onClick={onSwitchToRegister}
                            className="text-primary-600 font-semibold hover:text-primary-700"
                        >
                            Create one
                        </button>
                    ) : (
                        <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
                            Create one
                        </Link>
                    )}
                </p>
            </div>
        </form>
    );

    if (embedded) return formBody;

    return (
        <div className="min-h-screen bg-surface-200 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <Link to="/" className="flex items-center justify-center gap-2 mb-6 hover:opacity-90 transition">
                    <LogoMark size={40} />
                    <span className="text-2xl font-extrabold tracking-tight leading-none text-navy-600">
                        Early<span className="text-primary-500">Hub</span>
                    </span>
                </Link>

                <div className="card shadow-card-hover">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
                        <p className="text-sm text-slate-600">Sign in to manage your bookings</p>
                    </div>

                    {formBody}
                </div>

                <p className="text-center text-xs text-slate-500 mt-6">
                    Protected by industry-standard encryption
                </p>
            </div>
        </div>
    );
}
