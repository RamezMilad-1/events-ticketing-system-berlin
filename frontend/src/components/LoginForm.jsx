import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/AuthContext';

export default function LoginForm() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const intendedPath = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(form);
            toast.success(`Welcome back, ${user.name}!`);
            navigate(intendedPath, { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="card shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center">
                                <span className="text-3xl font-bold text-white">E</span>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
                        <p className="text-slate-600">Sign in to your EventHub account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                                Email Address
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
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                                    Password
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="input"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 pb-6 border-t border-slate-200" />
                    <div className="text-center">
                        <p className="text-slate-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-sm text-slate-600 mt-8">
                    Protected by enterprise-grade security
                </p>
            </div>
        </div>
    );
}
