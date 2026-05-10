import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock } from 'lucide-react';
import { authService } from '../services/api';
import { LogoMark } from './Logo';

const STEPS = { EMAIL: 1, OTP: 2, RESET: 3 };
const RESEND_COOLDOWN_SECONDS = 30;

export default function ForgotPassword({ embedded = false, onSuccess, onSwitchToLogin } = {}) {
    const navigate = useNavigate();
    const [step, setStep] = useState(STEPS.EMAIL);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const id = setInterval(() => setCooldown((c) => c - 1), 1000);
        return () => clearInterval(id);
    }, [cooldown]);

    const handleRequestOtp = async (e) => {
        e?.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error('Please enter a valid email address.');
            return;
        }
        setLoading(true);
        try {
            await authService.requestPasswordReset(email);
            toast.success('If an account exists for that email, a verification code is on its way.');
            setStep(STEPS.OTP);
            setCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not send code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!/^\d{6}$/.test(otp)) {
            toast.error('OTP must be exactly 6 digits.');
            return;
        }
        setLoading(true);
        try {
            const res = await authService.verifyPasswordResetOtp(email, otp);
            if (res.data?.resetToken) {
                setResetToken(res.data.resetToken);
                toast.success('Verified! Now choose a new password.');
                setStep(STEPS.RESET);
            } else {
                toast.error('Verification failed. Please try again.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Incorrect or expired code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            await authService.resetPassword({ resetToken, newPassword });
            toast.success('Password updated! Please sign in.');
            if (embedded) onSuccess?.();
            else navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not update password.');
        } finally {
            setLoading(false);
        }
    };

    const formBody = (
        <>
            <Stepper step={step} />

            {step === STEPS.EMAIL && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                    <p className="text-sm text-slate-600 -mt-2">Enter your email and we'll send a verification code.</p>
                    <div>
                        <label htmlFor="forgot-email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                        <input
                            id="forgot-email"
                            type="email"
                            placeholder="you@example.com"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary w-full">
                        {loading ? 'Sending…' : 'Send verification code'}
                    </button>
                </form>
            )}

            {step === STEPS.OTP && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <p className="text-sm text-slate-600 -mt-2">Check your inbox for a 6-digit code.</p>
                    <div>
                        <label htmlFor="otp" className="block text-sm font-semibold text-slate-700 mb-1.5">6-digit code</label>
                        <input
                            id="otp"
                            inputMode="numeric"
                            pattern="\d{6}"
                            maxLength={6}
                            placeholder="123456"
                            className="input text-center text-2xl tracking-[0.5em] font-mono"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            required
                            autoFocus
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Sent to <span className="font-semibold">{email}</span>
                        </p>
                    </div>
                    <button type="submit" disabled={loading || otp.length !== 6} className="btn btn-primary w-full">
                        {loading ? 'Verifying…' : 'Verify code'}
                    </button>
                    <div className="flex items-center justify-between text-sm">
                        <button
                            type="button"
                            onClick={() => setStep(STEPS.EMAIL)}
                            className="text-slate-600 hover:text-slate-900 font-medium"
                        >
                            ← Wrong email?
                        </button>
                        <button
                            type="button"
                            disabled={cooldown > 0 || loading}
                            onClick={handleRequestOtp}
                            className="text-primary-600 hover:text-primary-700 font-semibold disabled:opacity-40"
                        >
                            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                        </button>
                    </div>
                </form>
            )}

            {step === STEPS.RESET && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <p className="text-sm text-slate-600 -mt-2">Choose a new password for your account.</p>
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">New password</label>
                        <input
                            id="newPassword"
                            type="password"
                            placeholder="At least 6 characters"
                            className="input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Re-enter password"
                            className="input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary w-full">
                        {loading ? 'Updating…' : 'Update password'}
                    </button>
                </form>
            )}

            <div className="mt-5 pt-4 border-t border-slate-200 text-center">
                {embedded ? (
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-sm text-slate-600 hover:text-primary-600 font-medium"
                    >
                        ← Back to sign in
                    </button>
                ) : (
                    <Link to="/login" className="text-sm text-slate-600 hover:text-primary-600 font-medium">
                        ← Back to sign in
                    </Link>
                )}
            </div>
        </>
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
                        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary-50 flex items-center justify-center">
                            <Lock size={20} className="text-primary-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">Reset password</h1>
                    </div>

                    {formBody}
                </div>
            </div>
        </div>
    );
}

const Stepper = ({ step }) => (
    <div className="flex items-center justify-center gap-2 mb-5">
        {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
                <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                        step >= n ? 'bg-primary-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                >
                    {n}
                </div>
                {n < 3 && <div className={`w-8 h-0.5 ${step > n ? 'bg-primary-500' : 'bg-slate-200'}`} />}
            </div>
        ))}
    </div>
);
