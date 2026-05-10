import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, MapPin, Calendar, Tag, Users, Share2, Heart, Armchair, ShieldCheck } from 'lucide-react';
import { eventService, bookingService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import Loader from './ui/Loader';
import EventCard from './EventCard';
import TicketSelectionPanel from './TicketSelectionPanel';
import { formatDateTime, formatPrice, getAvailableTickets } from '../utils/format';

const EventDetails = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [event, setEvent] = useState(null);
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaved, setIsSaved] = useState(false);

    // Sync the "saved" toggle with localStorage so it survives reloads.
    useEffect(() => {
        if (!eventId) return;
        try {
            const raw = localStorage.getItem('saved-events') || '[]';
            const list = JSON.parse(raw);
            setIsSaved(Array.isArray(list) && list.includes(eventId));
        } catch {
            setIsSaved(false);
        }
    }, [eventId]);

    const toggleSaved = () => {
        try {
            const raw = localStorage.getItem('saved-events') || '[]';
            const list = JSON.parse(raw);
            const set = new Set(Array.isArray(list) ? list : []);
            if (set.has(eventId)) {
                set.delete(eventId);
                setIsSaved(false);
                toast.info('Removed from your saved events');
            } else {
                set.add(eventId);
                setIsSaved(true);
                toast.success('Saved! You can find it in your profile.');
            }
            localStorage.setItem('saved-events', JSON.stringify([...set]));
        } catch {
            toast.error('Could not save event (storage full?)');
        }
    };

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

                // No need to pre-fetch bookings here — the /booking/:id page does that
                // when the user actually starts picking seats.
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

    const requireBookingAuth = () => {
        if (!user) {
            toast.info('Please sign in to book tickets.');
            navigate('/login', { state: { from: { pathname: `/events/${eventId}` } } });
            return false;
        }
        if (user.role !== 'Standard User') {
            toast.error('Only standard users can book tickets.');
            return false;
        }
        return true;
    };

    const handleCheckout = (lines) => {
        if (!requireBookingAuth()) return;
        // Stash the chosen tickets for the booking page (it reads from sessionStorage on load)
        try {
            sessionStorage.setItem(`booking-cart-${eventId}`, JSON.stringify(lines));
        } catch {
            /* ignore quota errors */
        }
        navigate(`/booking/${eventId}`);
    };

    // Theater events skip the ticket-quantity panel entirely — users go straight to
    // the seat picker on the booking page, where seats ARE the tickets.
    const handleSelectSeats = () => {
        if (!requireBookingAuth()) return;
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
                                <button
                                    onClick={toggleSaved}
                                    aria-pressed={isSaved}
                                    className={`btn btn-outline btn-sm border-white/30 hover:bg-white/20 hover:border-white/50 transition ${
                                        isSaved ? 'bg-primary-500 text-white border-primary-500' : 'bg-white/10 text-white'
                                    }`}
                                >
                                    <Heart size={14} fill={isSaved ? 'currentColor' : 'none'} />
                                    {isSaved ? 'Saved' : 'Save'}
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
                    {event.category === 'theater' && event.custom_fields?.seating_rows ? (
                        <SeatPickerCard
                            tiers={tiers}
                            isSoldOut={isSoldOut}
                            onSelectSeats={handleSelectSeats}
                            footnote={!user ? "You'll sign in on the next step." : null}
                        />
                    ) : (
                        <TicketSelectionPanel
                            tiers={tiers}
                            isSoldOut={isSoldOut}
                            ctaLabel="Continue to checkout"
                            onCheckout={handleCheckout}
                            footnote={!user ? "You'll sign in on the next step." : null}
                        />
                    )}
                </aside>
            </div>
        </div>
    );
};

// Compact right-rail card for theater events — single-step "Select seats" CTA.
// Tier prices are shown for reference; seat-to-tier mapping happens on the booking page.
const SeatPickerCard = ({ tiers = [], isSoldOut, onSelectSeats, footnote }) => {
    const fromPrice = tiers.length > 0 ? Math.min(...tiers.map((t) => Number(t.price) || 0)) : 0;
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card p-5 sm:p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-2">
                <Armchair size={18} className="text-primary-500" />
                <h3 className="text-base font-bold text-navy-600">Pick your seats</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
                Choose any available seat in the auditorium — the price depends on the row. You can pick up to 5 seats per booking.
            </p>

            {tiers.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 mb-4 space-y-1.5">
                    {tiers.map((tier) => (
                        <div key={tier.type} className="flex items-baseline justify-between text-sm">
                            <span className="capitalize text-slate-700">{tier.type.replace(/_/g, ' ')}</span>
                            <span className="font-semibold text-slate-900">{formatPrice(tier.price)}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-baseline justify-between mb-3">
                <span className="text-sm text-slate-500">From</span>
                <span className="text-2xl font-extrabold text-navy-600">{formatPrice(fromPrice)}</span>
            </div>

            <button
                type="button"
                onClick={onSelectSeats}
                disabled={isSoldOut}
                className="btn btn-primary w-full btn-lg"
            >
                {isSoldOut ? 'Sold out' : 'Select seats'}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck size={13} />
                Secure checkout · Refundable up to 24h before
            </p>
            {footnote && <p className="mt-2 text-xs text-center text-slate-500">{footnote}</p>}
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
