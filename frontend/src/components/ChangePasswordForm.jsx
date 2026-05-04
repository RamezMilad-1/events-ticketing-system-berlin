import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { userService } from '../services/api';

const ChangePasswordForm = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.oldPassword.trim()) newErrors.oldPassword = 'Current password is required';
        if (!formData.newPassword.trim()) newErrors.newPassword = 'New password is required';
        else if (formData.newPassword.length < 6) newErrors.newPassword = 'Must be at least 6 characters';
        if (formData.newPassword !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError('');
        try {
            const response = await userService.changePassword({
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword,
            });
            if (response.status === 200) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Could not change password. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-card-hover animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-2xl">
                    <h2 className="text-lg font-bold text-slate-900">Change password</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
                    {submitError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                            {submitError}
                        </div>
                    )}

                    {[
                        { id: 'oldPassword', label: 'Current password' },
                        { id: 'newPassword', label: 'New password' },
                        { id: 'confirmPassword', label: 'Confirm new password' },
                    ].map(({ id, label }) => (
                        <div key={id}>
                            <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                            <input
                                type="password"
                                id={id}
                                name={id}
                                value={formData[id]}
                                onChange={handleChange}
                                className="input"
                            />
                            {errors[id] && <p className="mt-1 text-xs text-rose-600">{errors[id]}</p>}
                        </div>
                    ))}

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-sm">
                            {isSubmitting ? 'Changing…' : 'Change password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordForm;
