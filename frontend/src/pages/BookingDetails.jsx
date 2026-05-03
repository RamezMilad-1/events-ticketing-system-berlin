import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, MapPin, Calendar, Receipt, Ticket, Tag, X } from 'lucide-react';
import { bookingService } from '../services/api';
import Loader from '../components/ui/Loader';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
const formatDateTime = (d) =>
    new Date(d).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const STATUS_STYLES = {
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    canceled: 'bg-rose-50 text-rose-700 border-rose-200',
};

const BookingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await bookingService.getBookingById(id);
                setBooking(data?.booking || null);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to load booking.');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    const handleCancel = async () => {
        setCancelling(true);
        try {
            const { data } = await bookingService.cancelBooking(id);
            setBooking(data.booking);
            toast.success('Booking canceled. Tickets returned to availability.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not cancel booking.');
        } finally {
            setCancelling(false);
            setConfirmOpen(false);
        }
    };

    if (loading) return <Loader fullScreen label="Loading booking..." />;

    if (!booking) {
        return (
            <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
                <p className="text-2xl font-bold text-slate-900 mb-2">Booking not found</p>
                <Link to="/bookings" className="text-indigo-600 hover:underline font-semibold">
                    ← Back to my bookings
                </Link>
            </div>
        );
    }

    const event = booking.event || {};
    const isCanceled = booking.status === 'canceled';
    const isUpcoming = event.date ? new Date(event.date) > new Date() : false;
    const ticketCount =
        booking.ticketBookings?.reduce((sum, t) => sum + (t.quantity || 0), 0) ||
        booking.numberOfTickets ||
        0;

    return (
        <div className="container mx-auto max-w-4xl px-4 py-10">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium mb-6"
            >
                <ArrowLeft size={18} /> Back
            </button>

            <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                {/* Hero */}
                <div className="relative h-56 bg-slate-900">
                    {event.image && (
                        <img
                            src={event.image}
                            alt={event.title}
                            className="h-full w-full object-cover opacity-90"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 text-white">
                        <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                                STATUS_STYLES[booking.status] || ''
                            }`}
                        >
                            {booking.status}
                        </span>
                        <h1 className="mt-2 text-3xl font-bold">{event.title || 'Untitled event'}</h1>
                    </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoRow icon={<Calendar size={18} />} label="Date & time" value={event.date ? formatDateTime(event.date) : 'TBA'} />
                        <InfoRow icon={<MapPin size={18} />} label="Location" value={event.location || 'TBA'} />
                        <InfoRow icon={<Ticket size={18} />} label="Tickets" value={`${ticketCount} ticket${ticketCount === 1 ? '' : 's'}`} />
                        <InfoRow icon={<Receipt size={18} />} label="Total paid" value={formatCurrency(booking.totalPrice)} />
                    </div>

                    {booking.ticketBookings?.length > 0 && (
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-2">
                                <Tag size={16} /> Ticket breakdown
                            </h3>
                            <div className="space-y-2">
                                {booking.ticketBookings.map((tb, i) => (
                                    <div key={i} className="flex items-center justify-between border-b last:border-0 border-slate-200 pb-2 last:pb-0">
                                        <span className="font-medium text-slate-800 capitalize">{tb.ticketType}</span>
                                        <span className="text-slate-600">
                                            {tb.quantity} × {formatCurrency(tb.price)} = <strong>{formatCurrency(tb.quantity * tb.price)}</strong>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {booking.selectedSeats?.length > 0 && (
                        <div className="rounded-2xl bg-indigo-50 p-4">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-indigo-700 mb-2">Seats</h3>
                            <div className="flex flex-wrap gap-2">
                                {booking.selectedSeats.map((seat) => (
                                    <span
                                        key={seat}
                                        className="px-3 py-1 rounded-full bg-white border border-indigo-200 text-indigo-700 text-sm font-mono font-semibold"
                                    >
                                        {seat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-xs text-slate-500">
                        Booked on {formatDateTime(booking.createdAt)}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                        <Link to={`/events/${event._id}`} className="btn btn-secondary btn-sm">
                            View event
                        </Link>
                        {!isCanceled && isUpcoming && (
                            <button
                                onClick={() => setConfirmOpen(true)}
                                className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white"
                            >
                                <X size={14} /> Cancel booking
                            </button>
                        )}
                    </div>
                </div>
            </article>

            <ConfirmDialog
                open={confirmOpen}
                title="Cancel this booking?"
                description="Your tickets will be returned to availability and you'll need to book again if you change your mind."
                confirmLabel="Cancel booking"
                cancelLabel="Keep it"
                variant="danger"
                loading={cancelling}
                onConfirm={handleCancel}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

const InfoRow = ({ icon, label, value }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wide font-bold">
            {icon}
            {label}
        </div>
        <p className="mt-2 text-slate-900 font-semibold">{value}</p>
    </div>
);

export default BookingDetails;
