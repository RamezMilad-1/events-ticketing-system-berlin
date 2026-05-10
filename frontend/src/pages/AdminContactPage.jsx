import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Inbox, MailOpen, CheckCircle2, Trash2, Reply, Filter } from 'lucide-react';
import { contactService } from '../services/api';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const STATUSES = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'read', label: 'Read' },
    { key: 'resolved', label: 'Resolved' },
];

const SUBJECT_LABELS = {
    general: 'General enquiry',
    booking: 'Booking issue',
    organiser: 'Selling tickets / organisers',
    press: 'Press & partnerships',
    bug: 'Report a bug',
};

const STATUS_BADGE = {
    new: 'bg-primary-50 text-primary-700 border-primary-100',
    read: 'bg-amber-50 text-amber-700 border-amber-100',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const AdminContactPage = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [busyId, setBusyId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await contactService.list();
                setMessages(res.data?.messages || []);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to load messages');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const counts = useMemo(() => {
        return messages.reduce(
            (acc, m) => {
                acc.all += 1;
                acc[m.status] = (acc[m.status] || 0) + 1;
                return acc;
            },
            { all: 0, new: 0, read: 0, resolved: 0 }
        );
    }, [messages]);

    const filtered = useMemo(() => {
        if (filter === 'all') return messages;
        return messages.filter((m) => m.status === filter);
    }, [messages, filter]);

    const updateStatus = async (id, status) => {
        setBusyId(id);
        try {
            await contactService.updateStatus(id, status);
            setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, status } : m)));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleteLoading(true);
        try {
            await contactService.remove(deleteConfirm);
            setMessages((prev) => prev.filter((m) => m._id !== deleteConfirm));
            toast.success('Message deleted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete message');
        } finally {
            setDeleteLoading(false);
            setDeleteConfirm(null);
        }
    };

    if (loading) return <Loader fullScreen label="Loading inbox…" />;

    return (
        <div className="min-h-screen bg-surface-200/40 pb-12">
            <div className="container-page py-8">
                <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-navy-600 flex items-center gap-2">
                            <Inbox size={28} className="text-primary-500" /> Support inbox
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Messages submitted via the public Contact page. Reply by email — clicking <span className="font-semibold">Reply</span> opens your mail client with the user's address pre-filled.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Filter size={14} className="text-slate-400" />
                        {STATUSES.map((s) => (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => setFilter(s.key)}
                                className={`px-3 py-1.5 rounded-full font-semibold transition border ${
                                    filter === s.key
                                        ? 'bg-navy-600 text-white border-navy-600'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {s.label} <span className="opacity-70">({counts[s.key] || 0})</span>
                            </button>
                        ))}
                    </div>
                </header>

                {filtered.length === 0 ? (
                    <EmptyState
                        icon="📭"
                        title={messages.length === 0 ? 'No messages yet' : 'No messages match this filter'}
                        description={
                            messages.length === 0
                                ? 'When users submit the Contact form, their messages will appear here.'
                                : 'Try a different filter to see other messages.'
                        }
                    />
                ) : (
                    <div className="space-y-3">
                        {filtered.map((m) => (
                            <MessageCard
                                key={m._id}
                                message={m}
                                busy={busyId === m._id}
                                onMarkRead={() => updateStatus(m._id, 'read')}
                                onResolve={() => updateStatus(m._id, 'resolved')}
                                onReopen={() => updateStatus(m._id, 'new')}
                                onDelete={() => setDeleteConfirm(m._id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={Boolean(deleteConfirm)}
                title="Delete this message?"
                description="This permanently removes the message. You will lose the user's email and what they wrote."
                confirmLabel="Delete message"
                variant="danger"
                loading={deleteLoading}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(null)}
            />
        </div>
    );
};

const MessageCard = ({ message, busy, onMarkRead, onResolve, onReopen, onDelete }) => {
    const subjectLabel = SUBJECT_LABELS[message.subject] || message.subject;
    const replySubject = encodeURIComponent(`Re: [${subjectLabel}] your message to eventHub`);
    const replyBody = encodeURIComponent(
        `\n\n---\nOn ${formatDate(message.createdAt)} you wrote:\n\n${message.message}`
    );
    const mailto = `mailto:${message.email}?subject=${replySubject}&body=${replyBody}`;

    return (
        <article className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-navy-700">{message.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${STATUS_BADGE[message.status]}`}>
                            {message.status}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {subjectLabel}
                        </span>
                    </div>
                    <a href={`mailto:${message.email}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        {message.email}
                    </a>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(message.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <a href={mailto} className="btn btn-primary btn-sm" onClick={() => message.status === 'new' && onMarkRead()}>
                        <Reply size={14} /> Reply
                    </a>
                    {message.status === 'new' && (
                        <button type="button" onClick={onMarkRead} disabled={busy} className="btn btn-outline btn-sm">
                            <MailOpen size={14} /> Mark read
                        </button>
                    )}
                    {message.status !== 'resolved' && (
                        <button type="button" onClick={onResolve} disabled={busy} className="btn btn-outline btn-sm">
                            <CheckCircle2 size={14} /> Resolve
                        </button>
                    )}
                    {message.status === 'resolved' && (
                        <button type="button" onClick={onReopen} disabled={busy} className="btn btn-outline btn-sm">
                            Reopen
                        </button>
                    )}
                    <button type="button" onClick={onDelete} disabled={busy} className="btn btn-outline btn-sm text-rose-600 hover:bg-rose-50 border-rose-200">
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-surface-200/60 border border-slate-100">
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{message.message}</p>
            </div>
        </article>
    );
};

export default AdminContactPage;
