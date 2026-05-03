import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, MapPin, Calendar, Tag, Users, Ticket as TicketIcon } from 'lucide-react';
import { eventService, bookingService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import Loader from './ui/Loader';
import SeatSelectionModal from './SeatSelectionModal';

const formatDateTime = (d) =>
    new Date(d).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

// Returns visual classes + label for a ticket-type's remaining inventory.
const availabilityBadge = (remaining, total) => {
    if (remaining === 0) {
        return { label: 'Sold out', className: 'bg-rose-100 text-rose-700 border-rose-200' };
    }
    if (remaining <= 10) {
        return { label: `Only ${remaining} left`, className: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    return { label: `${remaining} of ${total} available`, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
};

const EventDetails = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookedSeats, setBookedSeats] = useState([]);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const eventResponse = await eventService.getEventById(eventId);
                setEvent(eventResponse.data);

                if (eventResponse.data.category === 'theater' && user) {
                    try {
                        const bookingsResponse = await bookingService.getBookingsForEvent(eventId);
                        const bookedList = bookingsResponse.data
                            .filter((b) => b.selectedSeats && b.status !== 'canceled')
                            .flatMap((b) => b.selectedSeats);
                        setBookedSeats(bookedList);
                    } catch {
                        setBookedSeats([]);
                    }
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load event details');
            } finally {
                setLoading(false);
            }
        };
        fetchEventDetails();
    }, [eventId, user]);

    const totalAvailable = useMemo(() => {
        if (!event) return 0;
        if (event.ticketTypes?.length > 0) {
            return event.ticketTypes.reduce((sum, t) => sum + (t.remaining || 0), 0);
        }
        return event.remainingTickets || 0;
    }, [event]);

    const handleBookNow = () => {
        if (!user) {
            toast.info('Please sign in to book tickets.');
            navigate('/login', { state: { from: { pathname: `/events/${eventId}` } } });
            return;
        }
        if (user.role !== 'Standard User') {
            toast.error('Only standard users can book tickets.');
            return;
        }
        if (totalAvailable === 0) {
            toast.error('This event is sold out.');
            return;
        }
        if (event.category === 'theater' && event.custom_fields?.seating_rows) {
            setIsModalOpen(true);
        } else {
            navigate(`/booking/${eventId}`);
        }
    };

    if (loading) return <Loader fullScreen label="Loading event..." />;

    if (error) {
        return (
            <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
                <p className="text-2xl font-bold text-slate-900 mb-2">Couldn't load event</p>
                <p className="text-slate-600 mb-6">{error}</p>
                <button onClick={() => navigate(-1)} className="btn btn-primary btn-sm">
                    ← Go back
                </button>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
                <p className="text-2xl font-bold text-slate-900">Event not found</p>
            </div>
        );
    }

    const isSoldOut = totalAvailable === 0;

    return (
        <div className="container mx-auto max-w-5xl px-4 py-8">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium mb-4"
            >
                <ArrowLeft size={18} /> Back
            </button>

            <article className="overflow-hidden rounded-3xl bg-white shadow-xl border border-slate-200">
                {/* Hero image */}
                <div className="relative h-72 sm:h-96 bg-slate-900">
                    {event.image ? (
                        <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-500">
                            No image provided
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 sm:p-8 text-white">
                        {event.category && (
                            <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3">
                                {event.category}
                            </span>
                        )}
                        <h1 className="text-3xl sm:text-5xl font-bold">{event.title}</h1>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-0">
                    {/* Main */}
                    <div className="lg:col-span-2 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{event.description}</p>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <Detail icon={<Calendar size={18} />} label="When" value={formatDateTime(event.date)} />
                            <Detail icon={<MapPin size={18} />} label="Where" value={event.location} />
                            {event.organizer?.name && (
                                <Detail icon={<Users size={18} />} label="Organizer" value={event.organizer.name} />
                            )}
                            <Detail icon={<Tag size={18} />} label="Category" value={event.category || 'general'} />
                        </div>

                        {/* Custom fields */}
                        {event.custom_fields && Object.keys(event.custom_fields).length > 0 && (
                            <div className="rounded-2xl bg-slate-50 p-5">
                                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Additional details</h3>
                                <div className="space-y-2">
                                    {Object.entries(event.custom_fields)
                                        .filter(([, v]) => v && (!Array.isArray(v) || v.length > 0))
                                        .map(([key, value]) => (
                                            <div key={key} className="flex items-start gap-3">
                                                <span className="text-slate-700 font-semibold capitalize min-w-[140px]">
                                                    {key.replace(/_/g, ' ')}:
                                                </span>
                                                <span className="text-slate-600 flex-1">{formatCustomValue(value)}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: pricing + book CTA */}
                    <aside className="p-6 sm:p-8 bg-slate-50/50 space-y-5">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <TicketIcon size={18} /> Tickets
                        </h3>

                        {event.ticketTypes?.length > 0 ? (
                            <div className="space-y-3">
                                {event.ticketTypes.map((tier) => {
                                    const badge = availabilityBadge(tier.remaining, tier.quantity);
                                    return (
                                        <div key={tier.type} className="rounded-xl border border-slate-200 bg-white p-4">
                                            <div className="flex items-baseline justify-between">
                                                <span className="font-bold text-slate-900 capitalize">{tier.type}</span>
                                                <span className="text-lg font-bold text-indigo-600">
                                                    ${tier.price}
                                                </span>
                                            </div>
                                            <span
                                                className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-semibold border ${badge.className}`}
                                            >
                                                {badge.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-baseline justify-between">
                                    <span className="font-bold text-slate-900">General admission</span>
                                    <span className="text-lg font-bold text-indigo-600">
                                        ${event.ticketPrice || 0}
                                    </span>
                                </div>
                                {(() => {
                                    const badge = availabilityBadge(event.remainingTickets || 0, event.totalTickets || 0);
                                    return (
                                        <span
                                            className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-semibold border ${badge.className}`}
                                        >
                                            {badge.label}
                                        </span>
                                    );
                                })()}
                            </div>
                        )}

                        <button
                            onClick={handleBookNow}
                            disabled={isSoldOut}
                            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSoldOut
                                ? 'Sold out'
                                : event.category === 'theater' && event.custom_fields?.seating_rows
                                ? 'Select seats'
                                : 'Book now'}
                        </button>

                        {!user && (
                            <p className="text-xs text-slate-500 text-center">
                                You'll need to sign in to complete a booking.
                            </p>
                        )}
                    </aside>
                </div>
            </article>

            {event.category === 'theater' && event.custom_fields?.seating_rows && (
                <SeatSelectionModal
                    event={event}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    bookedSeats={bookedSeats}
                />
            )}
        </div>
    );
};

const Detail = ({ icon, label, value }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wide">
            {icon}
            {label}
        </div>
        <p className="mt-2 text-slate-900 font-semibold">{value}</p>
    </div>
);

const formatCustomValue = (val) => {
    if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
            return val
                .map((obj) => {
                    if (obj.artist && obj.time) return `${obj.artist} at ${obj.time}`;
                    return Object.entries(obj)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ');
                })
                .join('; ');
        }
        return val.join(', ');
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object' && val !== null) {
        return Object.entries(val)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
    }
    return val;
};

export default EventDetails;
