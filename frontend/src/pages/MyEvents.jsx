import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, BarChart2, Edit, Trash2, MapPin, Calendar } from 'lucide-react';
import { userService, eventService } from '../services/api';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
    formatPriceRange,
    getMinPrice,
    getMaxPrice,
    getAvailableTickets,
    getTotalTickets,
} from '../utils/format';

const STATUS_BADGE = {
    approved: 'badge-success',
    pending: 'badge-warning',
    declined: 'badge-danger',
};

const MyEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const response = await userService.getMyEvents();
                setEvents(response.data?.events || []);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to fetch your events');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await eventService.deleteEvent(deleteId);
            setEvents((prev) => prev.filter((e) => e._id !== deleteId));
            toast.success('Event deleted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete event');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    if (loading) return <Loader fullScreen label="Loading your events…" />;

    return (
        <div className="bg-surface-200/40 min-h-screen pb-12">
            <div className="container-page py-8">
                <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-navy-600">My events</h1>
                        <p className="text-slate-600 mt-1">Manage events you've created.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/my-events/analytics" className="btn btn-outline btn-sm">
                            <BarChart2 size={16} /> Analytics
                        </Link>
                        <Link to="/my-events/new" className="btn btn-primary btn-sm">
                            <Plus size={16} /> New event
                        </Link>
                    </div>
                </header>

                {events.length === 0 ? (
                    <EmptyState
                        icon="🎉"
                        title="No events yet"
                        description="Create your first event to start selling tickets. Once submitted, it'll go through admin approval before being visible to the public."
                        action={
                            <Link to="/my-events/new" className="btn btn-primary btn-sm">
                                Create your first event
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {events.map((event) => {
                            const available = getAvailableTickets(event);
                            const total = getTotalTickets(event);
                            const min = getMinPrice(event);
                            const max = getMaxPrice(event);
                            return (
                                <article
                                    key={event._id}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card hover:shadow-card-hover transition"
                                >
                                    <div className="relative aspect-[4/3] bg-surface-200">
                                        {event.image ? (
                                            <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-400">
                                                <Calendar size={40} strokeWidth={1.5} />
                                            </div>
                                        )}
                                        <span
                                            className={`absolute top-3 right-3 badge ${STATUS_BADGE[event.status] || 'badge-neutral'}`}
                                        >
                                            {event.status}
                                        </span>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <h2 className="text-base font-bold text-navy-600 line-clamp-1">{event.title}</h2>
                                        <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>

                                        <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-500">
                                            <div className="inline-flex items-center gap-1 truncate">
                                                <Calendar size={12} className="shrink-0" />
                                                {new Date(event.date).toLocaleDateString('en-GB')}
                                            </div>
                                            <div className="inline-flex items-center gap-1 truncate">
                                                <MapPin size={12} className="shrink-0" />
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                            <div className="font-semibold text-slate-700">{formatPriceRange(min, max)}</div>
                                            <div>
                                                {available} / {total} left
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-3 border-t border-slate-100">
                                            <Link
                                                to={`/my-events/${event._id}/edit`}
                                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100 transition"
                                            >
                                                <Edit size={14} /> Edit
                                            </Link>
                                            <button
                                                onClick={() => setDeleteId(event._id)}
                                                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                <ConfirmDialog
                    open={Boolean(deleteId)}
                    title="Delete this event?"
                    description="This permanently removes the event. Existing bookings will become orphaned."
                    confirmLabel="Delete event"
                    variant="danger"
                    loading={deleting}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteId(null)}
                />
            </div>
        </div>
    );
};

export default MyEvents;
