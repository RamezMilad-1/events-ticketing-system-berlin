import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, MapPin, Calendar, Tag, Users, Share2, Heart } from 'lucide-react';
import { eventService, bookingService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import Loader from './ui/Loader';
import EventCard from './EventCard';
import SeatSelectionModal from './SeatSelectionModal';
import TicketSelectionPanel from './TicketSelectionPanel';
import { formatDateTime, getAvailableTickets } from '../utils/format';

const EventDetails = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [event, setEvent] = useState(null);
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookedSeats, setBookedSeats] = useState([]);

    useEffect(() => {
        const fetchEventDetails = async () => {
            setLoading(true);
            try {
                const [eventResponse, allResponse] = await Promise.all([
                    eventService.getEventById(eventId),
                    eventService.getAllEvents().catch(() => ({ data: [] })),
                ]);
                setEvent(eventResponse.data);
                setAllEvents(Array.isArray(allResponse.data) ? allResponse.data : []);

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

    const totalAvailable = useMemo(() => (event ? getAvailableTickets(event) : 0), [event]);
    const isSoldOut = totalAvailable === 0;

    const tiers = useMemo(() => {
        if (!event) return [];
        if (event.ticketTypes?.length > 0) return event.ticketTypes;
        return [
            {
                type: 'general',
                price: event.ticketPrice || 0,
                quantity: event.totalTickets || 0,
                remaining: event.remainingTickets || 0,
            },
        ];
    }, [event]);

    const relatedEvents = useMemo(() => {
        if (!event || !allEvents.length) return [];
        return allEvents
            .filter((e) => e._id !== event._id && e.category === event.category)
            .filter((e) => new Date(e.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 4);
    }, [event, allEvents]);

    const handleCheckout = (lines) => {
        if (!user) {
            toast.info('Please sign in to book tickets.');
            navigate('/login', { state: { from: { pathname: `/events/${eventId}` } } });
            return;
        }
        if (user.role !== 'Standard User') {
            toast.error('Only standard users can book tickets.');
            return;
        }
        if (event.category === 'theater' && event.custom_fields?.seating_rows) {
            setIsModalOpen(true);
            return;
        }
        // Stash the chosen tickets for the booking page (it reads from sessionStorage on load)
        try {
            sessionStorage.setItem(`booking-cart-${eventId}`, JSON.stringify(lines));
        } catch {
            /* ignore quota errors */
        }
        navigate(`/booking/${eventId}`);
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: event?.title, url });
            } catch {
                /* user cancelled */
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard');
            } catch {
                toast.info(url);
            }
        }
    };

    if (loading) return <Loader fullScreen label="Loading event…" />;

    if (error) {
        return (
            <div className="container-page py-16 text-center">
                <p className="text-2xl font-bold text-slate-900 mb-2">Couldn't load event</p>
                <p className="text-slate-600 mb-6">{error}</p>
                <button onClick={() => navigate(-1)} className="btn btn-primary btn-sm">
                    <ArrowLeft size={16} /> Go back
                </button>
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="bg-surface-200/40 pb-16">
            {/* Hero with blurred backdrop */}
            <div className="relative overflow-hidden">
                {event.image && (
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${event.image})`, filter: 'blur(40px)', transform: 'scale(1.1)' }}
                        aria-hidden="true"
                    />
                )}
                <div className="absolute inset-0 bg-navy-700/85" aria-hidden="true" />

                <div className="relative container-page py-8 sm:py-12">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium mb-6"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    <div className="grid lg:grid-cols-[300px,1fr] xl:grid-cols-[360px,1fr] gap-6 sm:gap-10 items-start">
                        {/* Poster */}
                        <div className="rounded-2xl overflow-hidden shadow-card-hover bg-slate-300 aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4] mx-auto w-full max-w-xs lg:max-w-none">
                            {event.image ? (
                                <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500 bg-surface-200">
                                    <Calendar size={64} strokeWidth={1.5} />
                                </div>
                            )}
                        </div>

                        {/* Title block */}
                        <div className="text-white">
                            {event.category && (
                                <span className="inline-block bg-primary-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                                    {event.category}
                                </span>
                            )}
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                                {event.title}
                            </h1>

                            <div className="space-y-2 text-white/90">
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-primary-300" />
                                    <span className="text-base font-medium">{formatDateTime(event.date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={18} className="text-primary-300" />
                                    <span className="text-base font-medium">{event.location}</span>
                                </div>
                                {event.organizer?.name && (
                                    <div className="flex items-center gap-2">
                                        <Users size={18} className="text-primary-300" />
                                        <span className="text-base font-medium">By {event.organizer.name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-6">
                                <button onClick={handleShare} className="btn btn-outline btn-sm bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50">
                                    <Share2 size={14} /> Share
                                </button>
                                <button className="btn btn-outline btn-sm bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50">
                                    <Heart size={14} /> Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="container-page mt-8 grid lg:grid-cols-[1fr,400px] gap-8 items-start">
                {/* Left column */}
                <div className="space-y-6">
                    <article className="card">
                        <h2 className="text-xl font-bold text-navy-600 mb-3">About this event</h2>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{event.description}</p>
                    </article>

                    {/* Custom fields */}
                    {event.custom_fields && Object.keys(event.custom_fields).filter((k) => {
                        const v = event.custom_fields[k];
                        return v && (!Array.isArray(v) || v.length > 0);
                    }).length > 0 && (
                        <article className="card">
                            <h2 className="text-xl font-bold text-navy-600 mb-3 flex items-center gap-2">
                                <Tag size={18} /> Details
                            </h2>
                            <dl className="grid sm:grid-cols-2 gap-3">
                                {Object.entries(event.custom_fields)
                                    .filter(([, v]) => v && (!Array.isArray(v) || v.length > 0))
                                    .map(([key, value]) => (
                                        <div key={key} className="rounded-lg bg-surface-200/60 p-3">
                                            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </dt>
                                            <dd className="text-sm text-slate-900 font-medium">{formatCustomValue(value)}</dd>
                                        </div>
                                    ))}
                            </dl>
                        </article>
                    )}

                    {/* Organizer block */}
                    {event.organizer?.name && (
                        <article className="card">
                            <h2 className="text-xl font-bold text-navy-600 mb-3">Organiser</h2>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                                    {event.organizer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">{event.organizer.name}</p>
                                    <p className="text-xs text-slate-500">Verified organiser</p>
                                </div>
                            </div>
                        </article>
                    )}

                    {/* Related events */}
                    {relatedEvents.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-navy-600 mb-4">You may also like</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {relatedEvents.map((rel) => (
                                    <EventCard key={rel._id} event={rel} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right column — sticky on desktop */}
                <aside className="lg:block">
                    <TicketSelectionPanel
                        tiers={tiers}
                        isSoldOut={isSoldOut}
                        ctaLabel={
                            event.category === 'theater' && event.custom_fields?.seating_rows ? 'Pick seats' : 'Continue to checkout'
                        }
                        onCheckout={handleCheckout}
                        footnote={!user ? 'You\'ll sign in on the next step.' : null}
                    />
                </aside>
            </div>

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
