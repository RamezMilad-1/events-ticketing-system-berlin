import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { LogoMark } from './Logo';

export default function RegisterForm({ embedded = false, onSuccess, onSwitchToLogin } = {}) {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        profilePicture: '',
        role: 'Standard User',
    });
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleProfilePictureFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setForm((prev) => ({ ...prev, profilePicture: reader.result }));
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password.length < 6) {
            const msg = 'Password must be at least 6 characters.';
            setError(msg);
            toast.error(msg);
            return;
        }
        if (form.password !== form.confirmPassword) {
            const msg = 'Passwords do not match.';
            setError(msg);
            toast.error(msg);
            return;
        }

        setLoading(true);
        try {
            const { confirmPassword, ...payload } = form;
            await register(payload);
            toast.success('Account created! Please sign in.');
            if (embedded) {
                onSuccess?.();
            } else {
                setTimeout(() => navigate('/login'), 1000);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed. Please try again.';
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
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">Full name</label>
                <input
                    id="name"
                    type="text"
                    placeholder="Anna Schmidt"
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    autoComplete="email"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="input pr-11"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            minLength={6}
                            autoComplete="new-password"
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
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm</label>
                    <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="input"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        required
                        minLength={6}
                        autoComplete="new-password"
                    />
                </div>
            </div>
            <p className="text-xs text-slate-500 -mt-2">At least 6 characters.</p>

            <div>
                <label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-1.5">Account type</label>
                <select
                    id="role"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="input"
                    required
                >
                    <option value="Standard User">Standard User — book events</option>
                    <option value="Organizer">Organiser — sell tickets</option>
                </select>
            </div>

            <div>
                <label htmlFor="profilePictureFile" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Profile picture (optional)
                </label>
                <input
                    id="profilePictureFile"
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:border file:border-slate-300 file:rounded-md file:bg-white file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-50"
                    onChange={handleProfilePictureFileChange}
                />
                {imagePreview && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 bg-white">
                        <img src={imagePreview} alt="Profile preview" className="w-full h-32 object-cover" />
                    </div>
                )}
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
                {loading ? 'Creating account…' : 'Create account'}
            </button>

            <div className="pt-3 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-600">
                    Already have an account?{' '}
                    {embedded ? (
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="text-primary-600 font-semibold hover:text-primary-700"
                        >
                            Sign in
                        </button>
                    ) : (
                        <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
                            Sign in
                        </Link>
                    )}
                </p>
            </div>

            <p className="text-center text-xs text-slate-500 pt-1">
                By registering, you agree to our Terms of Service and Privacy Policy.
            </p>
        </form>
    );

    if (embedded) return formBody;

    return (
        <div className="min-h-screen bg-surface-200 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <Link to="/" className="flex items-center justify-center gap-2 mb-6 hover:opacity-90 transition">
                    <LogoMark size={40} />
                    <span className="text-2xl font-extrabold tracking-tight leading-none text-navy-600">
                        event<span className="text-primary-500">Hub</span>
                    </span>
                </Link>

                <div className="card shadow-card-hover">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
                        <p className="text-sm text-slate-600">Join thousands of Berliners on eventHub</p>
                    </div>

                    {formBody}
                </div>
            </div>
        </div>
    );
}
