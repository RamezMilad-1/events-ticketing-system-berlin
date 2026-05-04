import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { userService } from '../services/api';

const UpdateProfileForm = ({ userDetails, onClose, onUpdate }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: userDetails.name || '',
        email: userDetails.email || '',
        profilePicture: userDetails.profilePicture || '',
    });
    const [imagePreview, setImagePreview] = useState(userDetails.profilePicture || '');
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const isChanged =
            formData.name !== userDetails.name ||
            formData.email !== userDetails.email ||
            formData.profilePicture !== userDetails.profilePicture;
        setHasChanges(isChanged);
    }, [formData, userDetails]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const compressImage = (base64String) =>
        new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 800;
                let { width, height } = img;
                if (width > height && width > MAX) {
                    height *= MAX / width;
                    width = MAX;
                } else if (height > MAX) {
                    width *= MAX / height;
                    height = MAX;
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = base64String;
        });

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setErrors((prev) => ({ ...prev, profilePicture: 'Please select an image file' }));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors((prev) => ({ ...prev, profilePicture: 'Image must be under 5MB' }));
            return;
        }
        const reader = new FileReader();
        reader.onloadend = async () => {
            const compressed = await compressImage(reader.result);
            setImagePreview(compressed);
            setFormData((prev) => ({ ...prev, profilePicture: compressed }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (!hasChanges) {
            onClose();
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');
        try {
            if (formData.profilePicture && formData.profilePicture.length > 1024 * 1024) {
                formData.profilePicture = await compressImage(formData.profilePicture);
            }
            const response = await userService.updateProfile(formData);
            if (response.data?.success) {
                onUpdate(response.data.user);
                onClose();
            } else {
                setSubmitError(response.data?.message || 'Failed to update profile');
            }
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Could not update profile.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

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
                    <h2 className="text-lg font-bold text-slate-900">Edit profile</h2>
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

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Profile picture</label>
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 rounded-full overflow-hidden bg-surface-200 border border-slate-200">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                                        {(formData.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="profile-picture-update"
                                />
                                <label htmlFor="profile-picture-update" className="btn btn-outline btn-sm cursor-pointer">
                                    Choose image
                                </label>
                                {errors.profilePicture && (
                                    <p className="mt-1 text-xs text-rose-600">{errors.profilePicture}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">Full name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input"
                        />
                        {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input"
                        />
                        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting || !hasChanges} className="btn btn-primary btn-sm">
                            {isSubmitting ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateProfileForm;
