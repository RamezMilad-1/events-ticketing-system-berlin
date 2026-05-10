import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, ShieldCheck, Calendar, MapPin, Minus, Plus } from 'lucide-react';
import { eventService, bookingService } from '../services/api';
import TheaterSeating from '../components/TheaterSeating';
import Loader from '../components/ui/Loader';
import { formatPrice, formatDateTime } from '../utils/format';

const Booking = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [event, setEvent] = useState(null);
    const [ticketSelections, setTicketSelections] = useState({});
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [bookedSeats, setBookedSeats] = useState([]);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await eventService.getEventById(eventId);
                const e = response.data;
                setEvent(e);

                if (e.category === 'theater') {
                    try {
                        const bookingsResponse = await bookingService.getBookingsForEvent(eventId);
                        const list = bookingsResponse.data
                            .filter((b) => b.selectedSeats && b.status !== 'canceled')
                            .flatMap((b) => b.selectedSeats);
                        setBookedSeats(list);
                    } catch {
                        setBookedSeats([]);
                    }

                    const seatsParam = searchParams.get('selectedSeats');
                    if (seatsParam) {
                        setSelectedSeats(seatsParam.split(',').filter(Boolean));
                    }
                } else if (e.ticketTypes?.length > 0) {
                    // Hydrate from sessionStorage if user already chose tickets on the detail page
                    let hydrated = null;
                    try {
                        hydrated = JSON.parse(sessionStorage.getItem(`booking-cart-${eventId}`) || 'null');
                    } catch {
                        hydrated = null;
                    }

                    const initial = {};
                    e.ticketTypes.forEach((t) => {
                        const found = hydrated?.find?.((l) => l.type === t.type);
                        initial[t.type] = found?.quantity || 0;
                    });
                    setTicketSelections(initial);
                }
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to load event.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId, searchParams]);

    const adjustQty = (type, delta, max) => {
        setTicketSelections((prev) => {
            const next = Math.max(0, Math.min((prev[type] || 0) + delta, max));
            return { ...prev, [type]: next };
        });
    };

    const handleSeatSelect = (seatId) => {
        setSelectedSeats((prev) => (prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]));
    };

    const tierForRow = (rowNum, totalRows, ticketTypes) => {
        if (!ticketTypes || ticketTypes.length === 0) return null;
        if (ticketTypes.length === 1) return ticketTypes[0];
        if (ticketTypes.length === 2) {
            return rowNum <= Math.ceil(totalRows / 2) ? ticketTypes[0] : ticketTypes[1];
        }
        if (rowNum <= Math.floor(totalRows * 0.3)) return ticketTypes[0];
        if (rowNum <= Math.floor(totalRows * 0.7)) return ticketTypes[1];
        return ticketTypes[2];
    };

    const calculateTotal = () => {
        if (!event) return 0;

        if (event.category === 'theater') {
            const totalRows = event.custom_fields?.seating_rows || 10;
            return selectedSeats.reduce((total, seatId) => {
                const [row] = seatId.split('-');
                const rowNum = parseInt(row, 10);
                const tier = tierForRow(rowNum, totalRows, event.ticketTypes);
                return total + (tier?.price || event.ticketPrice || 0);
            }, 0);
        }

        if (event.ticketTypes?.length > 0) {
            return event.ticketTypes.reduce(
                (total, t) => total + (ticketSelections[t.type] || 0) * t.price,
                0
            );
        }

        return (ticketSelections.legacy || 0) * (event.ticketPrice || 0);
    };

    const totalSelected = () => {
        if (event?.category === 'theater') return selectedSeats.length;
        return Object.values(ticketSelections).reduce((sum, q) => sum + q, 0);
    };

    const buildPayload = () => {
        if (event.category === 'theater') {
            const totalRows = event.custom_fields?.seating_rows || 10;
            const groups = {};
            selectedSeats.forEach((seatId) => {
                const [row] = seatId.split('-');
                const rowNum = parseInt(row, 10);
                const tier = tierForRow(rowNum, totalRows, event.ticketTypes);
                const ticketType = tier?.type || 'general';
                groups[ticketType] = (groups[ticketType] || 0) + 1;
            });

            return {
                event: eventId,
                ticketBookings: Object.entries(groups).map(([ticketType, quantity]) => ({ ticketType, quantity })),
                selectedSeats,
            };
        }

        if (event.ticketTypes?.length > 0) {
            const ticketBookings = Object.entries(ticketSelections)
                .filter(([, q]) => q > 0)
                .map(([ticketType, quantity]) => ({ ticketType, quantity }));
            return { event: eventId, ticketBookings };
        }

        return { event: eventId, numberOfTickets: ticketSelections.legacy || 0 };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (totalSelected() === 0) {
            toast.error('Please select at least one ticket or seat.');
            return;
        }
        if (!agreedToTerms) {
            toast.error('Please agree to the booking terms.');
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await bookingService.createBooking(buildPayload());
            sessionStorage.removeItem(`booking-cart-${eventId}`);
            toast.success(`Booking confirmed! ${formatPrice(data.booking?.totalPrice || calculateTotal())}`);
            const newBookingId = data.booking?._id;
            if (newBookingId) navigate(`/bookings/${newBookingId}`);
            else navigate('/booking-success');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to book tickets.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loader fullScreen label="Loading checkout…" />;

    if (!event) {
        return (
            <div className="container-page py-16 text-center">
                <p className="text-2xl font-bold text-slate-900">Event not found</p>
            </div>
        );
    }

    const total = calculateTotal();
    const totalCount = totalSelected();

    return (
        <div className="bg-surface-200/40 min-h-screen pb-16">
            <div className="container-page py-6">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 text-sm font-medium mb-4"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="grid lg:grid-cols-[1fr,360px] gap-6 items-start">
                    {/* Main panel */}
                    <div className="space-y-5">
                        {/* Event summary */}
                        <article className="card flex gap-4">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-surface-200 shrink-0">
                                {event.image && (
                                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <Link to={`/events/${event._id}`} className="text-xs text-primary-600 font-bold uppercase tracking-wider hover:underline">
                                    {event.category}
                                </Link>
                                <h1 className="text-xl sm:text-2xl font-bold text-navy-600 leading-tight mt-0.5 truncate">{event.title}</h1>
                                <div className="mt-2 space-y-1 text-sm text-slate-600">
                                    <div className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> {formatDateTime(event.date)}</div>
                                    <div className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {event.location}</div>
                                </div>
                            </div>
                        </article>

                        {/* Selection */}
                        <article className="card">
                            <h2 className="text-lg font-bold text-navy-600 mb-4">Choose your tickets</h2>

                            {event.category === 'theater' ? (
                                <div>
                                    <p className="text-sm text-slate-600 mb-4">Tap an available seat to add it to your order. Up to 5 per booking.</p>
                                    <TheaterSeating
                                        event={event}
                                        selectedSeats={selectedSeats}
                                        onSeatSelect={handleSeatSelect}
                                        maxSelectable={5}
                                        bookedSeats={bookedSeats}
                                    />
                                </div>
                            ) : event.ticketTypes?.length > 0 ? (
                                <div className="space-y-3">
                                    {event.ticketTypes.map((tier) => {
                                        const value = ticketSelections[tier.type] || 0;
                                        const tierSoldOut = tier.remaining === 0;
                                        return (
                                            <div
                                                key={tier.type}
                                                className={`flex items-center justify-between rounded-xl border ${
                                                    tierSoldOut ? 'border-slate-200 bg-slate-50' : 'border-slate-200'
                                                } p-4`}
                                            >
                                                <div>
                                                    <h3 className="font-semibold text-navy-600 capitalize">{tier.type.replace(/_/g, ' ')}</h3>
                                                    <p className="text-sm text-slate-500 mt-0.5">{formatPrice(tier.price)} each · {tier.remaining} available</p>
                                                </div>
                                                <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
                                                    <button
                                                        type="button"
                                                        onClick={() => adjustQty(tier.type, -1, tier.remaining)}
                                                        disabled={tierSoldOut || value === 0}
                                                        className="w-9 h-9 inline-flex items-center justify-center text-slate-600 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-10 text-center text-base font-bold text-slate-900">{value}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => adjustQty(tier.type, 1, tier.remaining)}
                                                        disabled={tierSoldOut || value >= tier.remaining}
                                                        className="w-9 h-9 inline-flex items-center justify-center text-slate-600 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Number of tickets</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={event.remainingTickets}
                                        value={ticketSelections.legacy || 0}
                                        onChange={(e) =>
                                            setTicketSelections({ legacy: Math.max(0, parseInt(e.target.value, 10) || 0) })
                                        }
                                        className="input"
                                    />
                                </div>
                            )}
                        </article>
                    </div>

                    {/* Order summary (sticky) */}
                    <form onSubmit={handleSubmit} className="lg:sticky lg:top-24">
                        <div className="card p-5">
                            <h2 className="text-lg font-bold text-navy-600 mb-4">Order summary</h2>

                            {totalCount === 0 ? (
                                <p className="text-sm text-slate-500">No tickets selected yet.</p>
                            ) : (
                                <ul className="space-y-2 text-sm">
                                    {event.category === 'theater' ? (
                                        <li className="flex justify-between text-slate-700">
                                            <span>{totalCount} seat{totalCount === 1 ? '' : 's'}</span>
                                            <span className="font-semibold">{formatPrice(total)}</span>
                                        </li>
                                    ) : event.ticketTypes?.length > 0 ? (
                                        event.ticketTypes
                                            .filter((t) => (ticketSelections[t.type] || 0) > 0)
                                            .map((t) => (
                                                <li key={t.type} className="flex justify-between text-slate-700">
                                                    <span className="capitalize">
                                                        {ticketSelections[t.type]} × {t.type.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="font-semibold">
                                                        {formatPrice(ticketSelections[t.type] * t.price)}
                                                    </span>
                                                </li>
                                            ))
                                    ) : (
                                        <li className="flex justify-between text-slate-700">
                                            <span>{ticketSelections.legacy || 0} × ticket</span>
                                            <span className="font-semibold">{formatPrice(total)}</span>
                                        </li>
                                    )}
                                </ul>
                            )}

                            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-sm text-slate-500">Total</span>
                                    <span className="text-2xl font-extrabold text-navy-600">{formatPrice(total)}</span>
                                </div>

                                <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span>
                                        I agree to the <a href="#" className="text-primary-600 hover:underline">terms</a> and acknowledge that eventHub does not store my card details.
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={submitting || totalCount === 0 || !agreedToTerms}
                                    className="btn btn-primary btn-lg w-full"
                                >
                                    {submitting ? 'Confirming…' : 'Confirm booking'}
                                </button>

                                <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                                    <ShieldCheck size={13} /> Secure checkout · Refundable up to 24h before
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Booking;
