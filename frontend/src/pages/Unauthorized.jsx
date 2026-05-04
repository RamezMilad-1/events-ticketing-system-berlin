import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export default function Unauthorized() {
    return (
        <div className="min-h-screen bg-surface-200/40 flex items-center justify-center px-4 py-16">
            <div className="card text-center max-w-md w-full">
                <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                    <ShieldX size={28} className="text-rose-500" />
                </div>
                <h1 className="text-2xl font-bold text-navy-600 mb-2">Access denied</h1>
                <p className="text-slate-600 mb-6">
                    You don't have permission to view this page. If you think this is a mistake, please contact support.
                </p>
                <Link to="/" className="btn btn-primary btn-sm">Back to home</Link>
            </div>
        </div>
    );
}
