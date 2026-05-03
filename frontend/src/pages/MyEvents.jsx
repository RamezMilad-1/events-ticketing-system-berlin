import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, BarChart2, Edit, Trash2, MapPin, Calendar } from 'lucide-react';
import { userService, eventService } from '../services/api';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const STATUS_BADGE = {
    approved: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    declined: 'bg-rose-100 text-rose-700',
};

const computeAvailable = (event) => {
    if (event.ticketTypes?.length > 0) {
        return event.ticketTypes.reduce((sum, t) => sum + (t.remaining || 0), 0);
    }
    return event.remainingTickets || 0;
};
const computeTotal = (event) => {
    if (event.ticketTypes?.length > 0) {
        return event.ticketTypes.reduce((sum, t) => sum + (t.quantity || 0), 0);
    }
    return event.totalTickets || 0;
};
const computePriceLabel = (event) => {
    if (event.ticketTypes?.length > 0) {
        const prices = event.ticketTypes.map((t) => t.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `$${min}` : `$${min} – $${max}`;
    }
    return event.ticketPrice != null ? `$${event.ticketPrice}` : '—';
};

const MyEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await userService.getMyEvents();
            const list = response.data?.events || [];
            setEvents(list);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to fetch your events');
        } finally {
            setLoading(false);
        }
    };

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

    if (loading) return <Loader fullScreen label="Loading your events..." />;

    return (
        <div className="container mx-auto max-w-7xl px-4 py-10">
            <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Events</h1>
                    <p className="text-slate-600 mt-1">Manage events you've created.</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/my-events/analytics" className="btn btn-secondary btn-sm inline-flex items-center gap-2">
                        <BarChart2 size={16} /> Analytics
                    </Link>
                    <Link to="/my-events/new" className="btn btn-primary btn-sm inline-flex items-center gap-2">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => {
                        const available = computeAvailable(event);
                        const total = computeTotal(event);
                        return (
                            <article
                                key={event._id}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
                            >
                                <div className="relative h-44 bg-slate-100">
                                    {event.image ? (
                                        <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-400">No image</div>
                                    )}
                                    <span
                                        className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                            STATUS_BADGE[event.status] || ''
                                        }`}
                                    >
                                        {event.status}
                                    </span>
                                </div>
                                <div className="p-5 space-y-3">
                                    <h2 className="text-lg font-bold text-slate-900 line-clamp-1">{event.title}</h2>
                                    <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>

                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                        <div className="inline-flex items-center gap-1">
                                            <Calendar size={12} /> {new Date(event.date).toLocaleDateString()}
                                        </div>
                                        <div className="inline-flex items-center gap-1">
                                            <MapPin size={12} /> {event.location}
                                        </div>
                                        <div>{computePriceLabel(event)}</div>
                                        <div>
                                            {available} / {total} left
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-slate-200">
                                        <Link
                                            to={`/my-events/${event._id}/edit`}
                                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                                        >
                                            <Edit size={14} /> Edit
                                        </Link>
                                        <button
                                            onClick={() => setDeleteId(event._id)}
                                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
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
    );
};

export default MyEvents;
