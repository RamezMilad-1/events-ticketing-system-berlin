import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Pencil, KeyRound, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { userService } from '../services/api';
import DefaultAvatar from '../components/DefaultAvatar';
import UpdateProfileForm from '../components/UpdateProfileForm';
import ChangePasswordForm from '../components/ChangePasswordForm';
import Loader from '../components/ui/Loader';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const Profile = () => {
    const { logout, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        (async () => {
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
        })();
    }, []);

    const handleUpdateProfile = async (updatedUser) => {
        setUserDetails(updatedUser);
        setIsEditing(false);
        toast.success('Profile updated.');
        await refreshUser();
    };

    const handleDeleteProfile = async () => {
        setDeleteLoading(true);
        try {
            await userService.deleteOwnProfile();
            await logout();
            toast.success('Profile deleted. See you next time.');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete profile');
        } finally {
            setDeleteLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    if (loading) return <Loader fullScreen label="Loading profile…" />;
    if (!userDetails) {
        return (
            <div className="container-page py-16 text-center">
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
                    onSuccess={() => {
                        setIsChangingPassword(false);
                        toast.success('Password changed.');
                    }}
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

            <div className="min-h-screen bg-surface-200/40 py-10 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
                        {/* Banner */}
                        <div className="bg-navy-700 h-32 relative">
                            <div className="absolute -bottom-12 left-8">
                                <div className="relative h-24 w-24 rounded-full overflow-hidden ring-4 ring-white shadow-card-hover bg-white">
                                    <DefaultAvatar name={userDetails.name} profilePicture={userDetails.profilePicture} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-16 pb-8 px-6 sm:px-8">
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-navy-600">{userDetails.name}</h1>
                                    <p className="text-sm text-primary-600 font-semibold mt-1">{userDetails.role}</p>
                                </div>
                                <button onClick={() => setIsEditing(true)} className="btn btn-primary btn-sm">
                                    <Pencil size={14} /> Edit profile
                                </button>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <section className="bg-surface-200/60 rounded-xl border border-slate-200 p-5">
                                    <h2 className="text-base font-bold text-navy-600 mb-4">Basic information</h2>
                                    <div className="space-y-3">
                                        <Field label="Full name" value={userDetails.name} />
                                        <Field label="Email address" value={userDetails.email} />
                                        <Field
                                            label="Member since"
                                            value={
                                                userDetails.createdAt
                                                    ? new Date(userDetails.createdAt).toLocaleDateString('en-GB', {
                                                          day: '2-digit',
                                                          month: 'short',
                                                          year: 'numeric',
                                                      })
                                                    : '—'
                                            }
                                        />
                                    </div>
                                </section>

                                <section className="bg-surface-200/60 rounded-xl border border-slate-200 p-5">
                                    <h2 className="text-base font-bold text-navy-600 mb-4">Account &amp; security</h2>
                                    <div className="space-y-3">
                                        <Field label="Role" value={userDetails.role} />
                                        <div>
                                            <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Status</p>
                                            <span className="badge badge-success mt-1">Active</span>
                                        </div>
                                        <div className="pt-2 flex flex-col gap-2">
                                            <button
                                                onClick={() => setIsChangingPassword(true)}
                                                className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 text-sm font-semibold transition"
                                            >
                                                <KeyRound size={14} /> Change password
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 text-sm font-semibold transition"
                                            >
                                                <Trash2 size={14} /> Delete account
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const Field = ({ label, value }) => (
    <div>
        <p className="text-xs uppercase tracking-wider font-bold text-slate-500">{label}</p>
        <p className="text-sm text-slate-900 font-medium mt-0.5 break-all">{value}</p>
    </div>
);

export default Profile;
