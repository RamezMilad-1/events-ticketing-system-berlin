import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPassword from './ForgotPassword';

/**
 * Modal-first auth — overlays login / register / forgot-password without leaving the page.
 * The standalone routes (/login, /register, /forgot-password) still render the same forms
 * for direct links and SEO.
 */
const AuthModal = ({ mode, onClose, onSwitch }) => {
    const [internalMode, setInternalMode] = useState(mode);

    useEffect(() => {
        setInternalMode(mode);
    }, [mode]);

    useEffect(() => {
        if (!mode) return undefined;
        const handler = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [mode, onClose]);

    if (!mode) return null;

    const switchTo = (next) => {
        setInternalMode(next);
        onSwitch?.(next);
    };

    const titles = {
        login: 'Sign in',
        register: 'Create your account',
        forgot: 'Reset password',
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-card-hover animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-2xl">
                    <h2 className="text-lg font-bold text-slate-900">{titles[internalMode]}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-6">
                    {internalMode === 'login' && (
                        <LoginForm
                            embedded
                            onSuccess={onClose}
                            onSwitchToRegister={() => switchTo('register')}
                            onSwitchToForgot={() => switchTo('forgot')}
                        />
                    )}
                    {internalMode === 'register' && (
                        <RegisterForm
                            embedded
                            onSuccess={() => switchTo('login')}
                            onSwitchToLogin={() => switchTo('login')}
                        />
                    )}
                    {internalMode === 'forgot' && (
                        <ForgotPassword
                            embedded
                            onSuccess={() => switchTo('login')}
                            onSwitchToLogin={() => switchTo('login')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
