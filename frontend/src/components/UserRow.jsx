import React from 'react';
import DefaultAvatar from './DefaultAvatar';
import HighlightText from './HighlightText';
import { useAuth } from '../auth/AuthContext';

const ROLE_BADGE = {
    'System Admin': 'bg-primary-50 text-primary-700',
    'Organizer': 'bg-emerald-50 text-emerald-700',
    'Standard User': 'bg-navy-50 text-navy-600',
};

const UserRow = ({
    user,
    validRoles,
    onRoleUpdate,
    onDelete,
    updateLoading,
    searchQuery,
}) => {
    const { user: currentUser } = useAuth();
    const isCurrentUser = currentUser._id === user._id;

    return (
        <>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-surface-200">
                        <DefaultAvatar name={user.name} profilePicture={user.profilePicture} />
                    </div>
                    <div className="ml-3">
                        <div className="text-sm font-semibold text-navy-600">
                            <HighlightText text={user.name} highlight={searchQuery} />
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                <HighlightText text={user.email} highlight={searchQuery} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`badge ${ROLE_BADGE[user.role] || 'badge-neutral'}`}>{user.role}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className="badge badge-success">Active</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <select
                    className="input py-1.5 text-sm w-44"
                    value={user.role}
                    onChange={(e) => onRoleUpdate(user._id, e.target.value)}
                    disabled={updateLoading === user._id || isCurrentUser}
                >
                    {validRoles.map((role) => (
                        <option key={role} value={role}>
                            {role}
                        </option>
                    ))}
                </select>
                {updateLoading === user._id && (
                    <p className="mt-1 text-xs text-slate-500">Updating…</p>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
                {!isCurrentUser ? (
                    <button
                        onClick={() => onDelete(user._id)}
                        className="text-rose-600 hover:text-rose-700 font-semibold transition"
                    >
                        Delete
                    </button>
                ) : (
                    <span className="text-slate-400 italic text-xs">Current user</span>
                )}
            </td>
        </>
    );
};

export default UserRow;
