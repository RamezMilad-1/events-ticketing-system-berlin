import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapPin, Receipt, ArrowUpRight, Clock, Ticket, CheckCircle2 } from 'lucide-react';
import { userService, bookingService } from '../services/api';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatPrice, formatDateTime } from '../utils/format';

const DEFAULT_IMAGE =
    'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=900&q=80';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [cancelId, setCancelId] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const { data } = await userService.getMyBookings();
                setBookings(data?.bookings || []);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Unable to load bookings.');
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const filteredBookings = useMemo(() => {
        const now = new Date();
        return bookings
            .filter((booking) => {
                const eventDate = booking.event?.date ? new Date(booking.event.date) : null;
                const isUpcoming = eventDate ? eventDate >= now : false;
                if (filter === 'upcoming') return isUpcoming && booking.status !== 'canceled';
                if (filter === 'cancelled') return booking.status === 'canceled';
                return true;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [bookings, filter]);

    const stats = useMemo(
        () => ({
            total: bookings.reduce(
                (sum, booking) => (booking.status === 'canceled' ? sum : sum + (booking.totalPrice || 0)),
                0
            ),
            tickets: bookings.reduce((sum, booking) => {
                if (booking.status === 'canceled') return sum;
                return (
                    sum +
                    (booking.ticketBookings?.reduce((tSum, t) => tSum + (t.quantity || 0), 0) ||
                        booking.numberOfTickets ||
                        0)
                );
            }, 0),
            upcoming: bookings.filter(
                (b) => b.status !== 'canceled' && b.event?.date && new Date(b.event.date) >= new Date()
            ).length,
        }),
        [bookings]
    );

    const handleCancel = async () => {
        if (!cancelId) return;
        setCancelling(true);
        try {
            await bookingService.cancelBooking(cancelId);
            setBookings((current) =>
                current.map((b) => (b._id === cancelId ? { ...b, status: 'canceled' } : b))
            );
            toast.success('Booking canceled — tickets returned.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Unable to cancel booking.');
        } finally {
            setCancelling(false);
            setCancelId(null);
        }
    };

    if (loading) return <Loader fullScreen label="Loading your bookings…" />;

    return (
        <div className="bg-surface-200/40 min-h-screen pb-16">
            <div className="container-page py-8">
                <div className="flex items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-navy-600">My bookings</h1>
                        <p className="text-sm text-slate-500 mt-1">All your tickets in one place.</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <StatCard icon={<Clock size={18} />} label="Upcoming" value={stats.upcoming} />
                    <StatCard icon={<Ticket size={18} />} label="Tickets" value={stats.tickets} />
                    <StatCard icon={<Receipt size={18} />} label="Total spent" value={formatPrice(stats.total)} />
                </div>

                {/* Filter tabs */}
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'upcoming', label: 'Upcoming' },
                            { id: 'cancelled', label: 'Cancelled' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                                    filter === tab.id
                                        ? 'bg-navy-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4">
                    {filteredBookings.length === 0 ? (
                        <EmptyState
                            icon="🎫"
                            title="No bookings here yet"
                            description="Switch filters or browse events to book your next experience."
                            action={
                                <Link to="/" className="btn btn-primary btn-sm">
                                    Browse events
                                </Link>
                            }
                        />
                    ) : (
                        filteredBookings.map((booking) => (
                            <BookingCard
                                key={booking._id}
                                booking={booking}
                                onCancel={() => setCancelId(booking._id)}
                            />
                        ))
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={Boolean(cancelId)}
                title="Cancel this booking?"
                description="Your tickets will be returned to availability."
                confirmLabel="Cancel booking"
                cancelLabel="Keep it"
                variant="danger"
                loading={cancelling}
                onConfirm={handleCancel}
                onCancel={() => setCancelId(null)}
            />
        </div>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-1.5 text-primary-500">{icon}</div>
        <p className="mt-2 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-navy-600">{value}</p>
    </div>
);

const BookingCard = ({ booking, onCancel }) => {
    const { event = {}, status, totalPrice, ticketBookings = [], selectedSeats = [] } = booking;
    const dateTime = event.date ? formatDateTime(event.date) : 'TBA';
    const isUpcoming = event.date ? new Date(event.date) >= new Date() : false;
    const ticketCount =
        ticketBookings.reduce((sum, t) => sum + (t.quantity || 0), 0) || booking.numberOfTickets || 0;
    const isCanceled = status === 'canceled';

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card hover:shadow-card-hover transition">
            <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                <div className="relative h-44 md:h-full overflow-hidden bg-navy-700">
                    <img
                        src={event.image || DEFAULT_IMAGE}
                        alt={event.title || 'Event'}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-700/80 to-transparent md:bg-none" />
                    <div className="absolute bottom-3 left-3 md:hidden text-white">
                        <p className="text-[10px] uppercase tracking-wider text-white/80">{event.category || 'EVENT'}</p>
                        <h3 className="text-lg font-bold leading-tight">{event.title || 'Untitled event'}</h3>
                    </div>
                </div>

                <div className="flex flex-col justify-between p-5">
                    <div>
                        <div className="hidden md:flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wider text-primary-600 font-bold">{event.category || 'EVENT'}</span>
                        </div>
                        <h3 className="hidden md:block text-xl font-bold text-navy-600 leading-tight mb-2">
                            {event.title || 'Untitled event'}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span
                                className={`badge ${isCanceled ? 'badge-danger' : 'badge-success'}`}
                            >
                                {isCanceled ? 'Cancelled' : (
                                    <><CheckCircle2 size={12} className="mr-1" />Confirmed</>
                                )}
                            </span>
                            <span className="badge badge-neutral">
                                {isUpcoming ? 'Upcoming' : 'Past event'}
                            </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2.5 text-sm">
                            <InfoLine icon={<Clock size={14} />} value={dateTime} />
                            <InfoLine icon={<MapPin size={14} />} value={event.location || 'TBA'} />
                            <InfoLine icon={<Ticket size={14} />} value={`${ticketCount} ticket${ticketCount === 1 ? '' : 's'}`} />
                            <InfoLine icon={<Receipt size={14} />} value={formatPrice(totalPrice)} />
                        </div>

                        {selectedSeats.length > 0 && (
                            <p className="mt-3 text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">Seats:</span> {selectedSeats.join(', ')}
                            </p>
                        )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Link
                            to={`/bookings/${booking._id}`}
                            className="btn btn-outline btn-sm"
                        >
                            <ArrowUpRight size={14} /> View details
                        </Link>
                        {!isCanceled && isUpcoming && (
                            <button onClick={onCancel} className="btn btn-danger btn-sm">
                                Cancel booking
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
};

const InfoLine = ({ icon, value }) => (
    <div className="flex items-center gap-1.5 text-slate-600">
        <span className="text-slate-400 shrink-0">{icon}</span>
        <span className="truncate">{value}</span>
    </div>
);

export default MyBookings;
