import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/AuthContext';
import { userService } from '../services/api';
import DefaultAvatar from '../components/DefaultAvatar';
import UpdateProfileForm from '../components/UpdateProfileForm';
import ChangePasswordForm from '../components/ChangePasswordForm';
import Loader from '../components/ui/Loader';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const Profile = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchUserDetails = async () => {
        try {
            const response = await userService.getProfile();
            if (response.data?.success && response.data.user) {
                setUserDetails(response.data.user);
            } else {
                toast.error('Could not load profile.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to fetch profile.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserDetails();
    }, []);

    const handleUpdateProfile = async (updatedUser) => {
        setUserDetails(updatedUser);
        setIsEditing(false);
        toast.success('Profile updated.');
        await refreshUser();
    };

    const handlePasswordChangeSuccess = () => {
        setIsChangingPassword(false);
        toast.success('Password changed.');
    };

    const handleDeleteProfile = async () => {
        setDeleteLoading(true);
        try {
            await userService.deleteOwnProfile();
            await logout();
            toast.success('Profile deleted. See you next time.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete profile');
        } finally {
            setDeleteLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    if (loading) return <Loader fullScreen label="Loading profile..." />;
    if (!userDetails) {
        return (
            <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
                <p className="text-2xl font-bold text-slate-900">Profile unavailable</p>
            </div>
        );
    }

    return (
        <>
            {isEditing && (
                <UpdateProfileForm
                    userDetails={userDetails}
                    onClose={() => setIsEditing(false)}
                    onUpdate={handleUpdateProfile}
                />
            )}

            {isChangingPassword && (
                <ChangePasswordForm
                    onClose={() => setIsChangingPassword(false)}
                    onSuccess={handlePasswordChangeSuccess}
                />
            )}

            <ConfirmDialog
                open={showDeleteConfirm}
                title="Delete your account?"
                description="This permanently removes your profile, bookings, and any events you've created. This cannot be undone."
                confirmLabel="Delete account"
                variant="danger"
                loading={deleteLoading}
                onConfirm={handleDeleteProfile}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 h-40 relative">
                            <div className="absolute -bottom-12 left-10">
                                <div className="relative h-24 w-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg bg-white">
                                    <DefaultAvatar name={userDetails.name} profilePicture={userDetails.profilePicture} />
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                                        title="Change profile picture"
                                    >
                                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.536-6.536a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 17H9v-3l6.232-6.232z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-20 pb-10 px-8">
                            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                                <div>
                                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{userDetails.name}</h1>
                                    <p className="text-sm text-indigo-600 font-medium">{userDetails.role}</p>
                                </div>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn btn-primary btn-sm"
                                >
                                    Edit Profile
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                                    <h2 className="text-lg font-bold text-gray-800 mb-4">Basic Information</h2>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Full Name</p>
                                            <p className="text-base font-medium text-gray-900">{userDetails.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Email Address</p>
                                            <p className="text-base font-medium text-gray-900">{userDetails.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Member since</p>
                                            <p className="text-base font-medium text-gray-900">
                                                {userDetails.createdAt
                                                    ? new Date(userDetails.createdAt).toLocaleDateString()
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                                    <h2 className="text-lg font-bold text-gray-800 mb-4">Account & security</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Role</p>
                                            <p className="text-base font-medium text-gray-900">{userDetails.role}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Status</p>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                                Active
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => setIsChangingPassword(true)}
                                                className="text-indigo-600 hover:underline text-sm font-medium text-left"
                                            >
                                                Change password
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="text-rose-600 hover:text-rose-700 text-sm font-medium text-left"
                                            >
                                                Delete account
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
