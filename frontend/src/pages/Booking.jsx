import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { eventService, bookingService } from '../services/api';
import TheaterSeating from '../components/TheaterSeating';
import Loader from '../components/ui/Loader';

const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

const Booking = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [event, setEvent] = useState(null);
    const [ticketSelections, setTicketSelections] = useState({});
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [bookedSeats, setBookedSeats] = useState([]);
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
                    const initial = {};
                    e.ticketTypes.forEach((t) => {
                        initial[t.type] = 0;
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

    const handleTicketQuantityChange = (ticketType, quantity) => {
        setTicketSelections((prev) => ({
            ...prev,
            [ticketType]: Math.max(0, parseInt(quantity, 10) || 0),
        }));
    };

    const handleSeatSelect = (seatId) => {
        setSelectedSeats((prev) => (prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]));
    };

    // Mirror of TheaterSeating's tierForRow — keep these in sync.
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
                return total + (tier?.price || event.ticketPrice || 50);
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

        setSubmitting(true);
        try {
            const { data } = await bookingService.createBooking(buildPayload());
            toast.success(
                `Booking confirmed! Total: ${formatCurrency(data.booking?.totalPrice || calculateTotal())}`
            );
            const newBookingId = data.booking?._id;
            if (newBookingId) {
                navigate(`/bookings/${newBookingId}`);
            } else {
                navigate('/booking-success');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to book tickets.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loader fullScreen label="Loading booking..." />;

    if (!event) {
        return (
            <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
                <p className="text-2xl font-bold text-slate-900">Event not found</p>
            </div>
        );
    }

    const total = calculateTotal();
    const totalCount = totalSelected();

    return (
        <div className="container mx-auto max-w-3xl px-4 py-8">
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium"
                >
                    ← Back
                </button>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Book Tickets</h1>
                <h2 className="text-lg font-semibold text-slate-700">{event.title}</h2>
                <p className="text-slate-600 mt-1">{event.description}</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    {event.category === 'theater' ? (
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3">Choose your seats</h3>
                            <TheaterSeating
                                event={event}
                                selectedSeats={selectedSeats}
                                onSeatSelect={handleSeatSelect}
                                maxSelectable={5}
                                bookedSeats={bookedSeats}
                            />
                        </div>
                    ) : event.ticketTypes?.length > 0 ? (
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3">Choose tickets</h3>
                            <div className="space-y-3">
                                {event.ticketTypes.map((ticket) => (
                                    <div
                                        key={ticket.type}
                                        className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white"
                                    >
                                        <div>
                                            <h4 className="font-semibold text-slate-900 capitalize">{ticket.type}</h4>
                                            <p className="text-sm text-slate-500">${ticket.price} each</p>
                                            <p className="text-xs text-slate-400">{ticket.remaining} available</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleTicketQuantityChange(
                                                        ticket.type,
                                                        (ticketSelections[ticket.type] || 0) - 1
                                                    )
                                                }
                                                disabled={(ticketSelections[ticket.type] || 0) <= 0}
                                                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                                            >
                                                –
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                max={ticket.remaining}
                                                value={ticketSelections[ticket.type] || 0}
                                                onChange={(e) =>
                                                    handleTicketQuantityChange(ticket.type, e.target.value)
                                                }
                                                className="w-16 text-center border border-slate-300 rounded-lg px-2 py-1"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleTicketQuantityChange(
                                                        ticket.type,
                                                        (ticketSelections[ticket.type] || 0) + 1
                                                    )
                                                }
                                                disabled={(ticketSelections[ticket.type] || 0) >= ticket.remaining}
                                                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Number of Tickets
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={event.remainingTickets}
                                value={ticketSelections.legacy || 0}
                                onChange={(e) => handleTicketQuantityChange('legacy', e.target.value)}
                                className="input"
                            />
                        </div>
                    )}

                    <div className="rounded-xl bg-indigo-50 p-4 flex items-baseline justify-between">
                        <span className="text-sm font-bold uppercase tracking-wide text-indigo-700">Total</span>
                        <span className="text-2xl font-bold text-indigo-700">{formatCurrency(total)}</span>
                    </div>

                    {totalCount > 0 && (
                        <p className="text-sm text-slate-600">
                            {totalCount} {event.category === 'theater' ? 'seat' : 'ticket'}
                            {totalCount === 1 ? '' : 's'} selected
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || totalCount === 0}
                        className="btn btn-primary w-full disabled:opacity-50"
                    >
                        {submitting ? 'Confirming...' : 'Confirm Booking'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Booking;
