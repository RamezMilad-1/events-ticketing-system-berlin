import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/AuthContext';

export default function RegisterForm() {
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
            toast.success('Registration successful! Please sign in.');
            setTimeout(() => navigate('/login'), 1200);
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed. Please try again.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <div className="card shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center">
                                <span className="text-3xl font-bold text-white">E</span>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Join EventHub</h1>
                        <p className="text-slate-600">Create your account to get started</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                className="input"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                                Email Address
                            </label>
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
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="input"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Confirm
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
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
                            <label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-2">
                                Account Type
                            </label>
                            <select
                                id="role"
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                className="input"
                                required
                            >
                                <option value="Standard User">Standard User (Book Events)</option>
                                <option value="Organizer">Event Organizer (Post Events)</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="profilePictureFile" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Profile Picture (Optional)
                                </label>
                                <input
                                    id="profilePictureFile"
                                    type="file"
                                    accept="image/*"
                                    className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:border file:border-slate-300 file:rounded-md file:bg-white file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-100"
                                    onChange={handleProfilePictureFileChange}
                                />
                            </div>
                            {imagePreview && (
                                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                                    <img src={imagePreview} alt="Profile preview" className="w-full h-40 object-cover" />
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 pb-6 border-t border-slate-200" />
                    <div className="text-center">
                        <p className="text-slate-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-8">
                    By registering, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
