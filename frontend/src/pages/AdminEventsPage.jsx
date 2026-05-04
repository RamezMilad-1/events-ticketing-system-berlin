import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Trash2, MapPin, Calendar, User } from 'lucide-react';
import { eventService } from '../services/api';
import Loader from '../components/ui/Loader';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { formatPrice } from '../utils/format';

const STATUS_TABS = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'declined', label: 'Declined' },
];

const STATUS_BADGE = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    declined: 'bg-rose-50 text-rose-700 border-rose-200',
};

const computeAvailableTickets = (event) => {
    if (event.ticketTypes?.length > 0) {
        return event.ticketTypes.reduce((sum, t) => sum + (t.remaining || 0), 0);
    }
    return event.remainingTickets || 0;
};

const computeTotalTickets = (event) => {
    if (event.ticketTypes?.length > 0) {
        return event.ticketTypes.reduce((sum, t) => sum + (t.quantity || 0), 0);
    }
    return event.totalTickets || 0;
};

const AdminEventsPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [actionLoading, setActionLoading] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const fetchEvents = async () => {
        try {
            const response = await eventService.getAllEventsAdmin();
            setEvents(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const filteredEvents = useMemo(
        () => (filter === 'all' ? events : events.filter((e) => e.status === filter)),
        [events, filter]
    );

    const handleStatusChange = async (eventId, status) => {
        setActionLoading(eventId);
        try {
            await eventService.updateEventStatus(eventId, status);
            setEvents((prev) => prev.map((e) => (e._id === eventId ? { ...e, status } : e)));
            toast.success(`Event ${status}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update event status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setActionLoading(deleteId);
        try {
            await eventService.deleteEvent(deleteId);
            setEvents((prev) => prev.filter((e) => e._id !== deleteId));
            toast.success('Event deleted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete event');
        } finally {
            setActionLoading(null);
            setDeleteId(null);
        }
    };

    const counts = useMemo(
        () => ({
            all: events.length,
            pending: events.filter((e) => e.status === 'pending').length,
            approved: events.filter((e) => e.status === 'approved').length,
            declined: events.filter((e) => e.status === 'declined').length,
        }),
        [events]
    );

    if (loading) return <Loader fullScreen label="Loading events..." />;

    return (
        <div className="bg-surface-200/40 min-h-screen pb-12">
        <div className="container-page py-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-navy-600">Manage events</h1>
                <p className="text-slate-600 mt-1">Approve, decline, or remove events submitted by organisers.</p>
            </header>

            {/* Tabs */}
            <div className="mb-6 inline-flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-1">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                            filter === tab.id
                                ? 'bg-primary-600 text-white shadow'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        {tab.label}
                        <span
                            className={`text-xs rounded-full px-2 py-0.5 ${
                                filter === tab.id ? 'bg-white/30' : 'bg-slate-200'
                            }`}
                        >
                            {counts[tab.id]}
                        </span>
                    </button>
                ))}
            </div>

            {filteredEvents.length === 0 ? (
                <EmptyState icon="🗓️" title="No events" description={`No events match the "${filter}" filter.`} />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Event</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Organizer</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Date & Tickets</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredEvents.map((event) => {
                                    const total = computeTotalTickets(event);
                                    const available = computeAvailableTickets(event);
                                    return (
                                        <tr key={event._id} className="hover:bg-slate-50/60">
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <img
                                                        src={event.image || 'https://placehold.co/80x80?text=Event'}
                                                        alt=""
                                                        className="h-16 w-16 rounded-lg object-cover bg-slate-100"
                                                    />
                                                    <div className="min-w-0">
                                                        <Link
                                                            to={`/events/${event._id}`}
                                                            className="font-semibold text-slate-900 hover:text-primary-600 line-clamp-1"
                                                        >
                                                            {event.title}
                                                        </Link>
                                                        <p className="text-sm text-slate-500 line-clamp-2">{event.description}</p>
                                                        <p className="mt-1 text-xs text-slate-400 inline-flex items-center gap-1">
                                                            <MapPin size={12} /> {event.location}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-900 inline-flex items-center gap-1">
                                                    <User size={14} /> {event.organizer?.name || 'Unknown'}
                                                </div>
                                                <div className="text-xs text-slate-500">{event.organizer?.email || ''}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="inline-flex items-center gap-1 text-slate-700">
                                                    <Calendar size={14} /> {new Date(event.date).toLocaleDateString()}
                                                </div>
                                                <div className="text-slate-500 text-xs mt-1">
                                                    Available: {available} / {total}
                                                </div>
                                                {event.ticketPrice != null && (
                                                    <div className="text-slate-500 text-xs">From {formatPrice(event.ticketPrice)}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                                                        STATUS_BADGE[event.status] || ''
                                                    }`}
                                                >
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {event.status !== 'approved' && (
                                                        <button
                                                            onClick={() => handleStatusChange(event._id, 'approved')}
                                                            disabled={actionLoading === event._id}
                                                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                                        >
                                                            <CheckCircle size={14} /> Approve
                                                        </button>
                                                    )}
                                                    {event.status !== 'declined' && (
                                                        <button
                                                            onClick={() => handleStatusChange(event._id, 'declined')}
                                                            disabled={actionLoading === event._id}
                                                            className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                                                        >
                                                            <XCircle size={14} /> Decline
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setDeleteId(event._id)}
                                                        disabled={actionLoading === event._id}
                                                        className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={Boolean(deleteId)}
                title="Delete this event?"
                description="This permanently removes the event and cannot be undone. Any related bookings will be orphaned."
                confirmLabel="Delete event"
                variant="danger"
                loading={actionLoading === deleteId}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
        </div>
    );
};

export default AdminEventsPage;
