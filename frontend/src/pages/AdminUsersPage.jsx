import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Search } from 'lucide-react';
import { userService } from '../services/api';
import UserRow from '../components/UserRow';
import Loader from '../components/ui/Loader';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const VALID_ROLES = ['Standard User', 'Organizer', 'System Admin'];

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await userService.getAllUsers();
                // Backend now returns {success, users}; tolerate older shape that returned an array directly.
                const list = Array.isArray(response.data) ? response.data : response.data?.users || [];
                setUsers(list);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return users;
        return users.filter(
            (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
        );
    }, [users, searchQuery]);

    const handleRoleUpdate = async (userId, newRole) => {
        setUpdateLoading(userId);
        try {
            const response = await userService.updateUserRole(userId, newRole);
            const updatedUser = response.data?.user;
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, ...(updatedUser || { role: newRole }) } : u))
            );
            toast.success(`Role updated to ${newRole}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update role');
        } finally {
            setUpdateLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleteLoading(true);
        try {
            await userService.deleteUser(deleteConfirm);
            setUsers((prev) => prev.filter((u) => u._id !== deleteConfirm));
            toast.success('User deleted successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete user');
        } finally {
            setDeleteLoading(false);
            setDeleteConfirm(null);
        }
    };

    if (loading) return <Loader fullScreen label="Loading users..." />;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-600 mt-1">View, update roles, and remove user accounts.</p>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <h2 className="text-lg font-semibold text-slate-800">{users.length} users</h2>
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Current Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Update Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredUsers.map((u) => (
                                    <tr key={u._id}>
                                        <UserRow
                                            user={u}
                                            validRoles={VALID_ROLES}
                                            onRoleUpdate={handleRoleUpdate}
                                            onDelete={() => setDeleteConfirm(u._id)}
                                            updateLoading={updateLoading}
                                            searchQuery={searchQuery}
                                        />
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-10 text-slate-500">
                                No users match your search.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={Boolean(deleteConfirm)}
                title="Delete this user?"
                description="This action cannot be undone. The user's bookings and events will become orphaned."
                confirmLabel="Delete user"
                variant="danger"
                loading={deleteLoading}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(null)}
            />
        </div>
    );
};

export default AdminUsersPage;
