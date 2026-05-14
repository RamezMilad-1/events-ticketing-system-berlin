import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { formatDateShort, formatPrice, getMinPrice } from '../utils/format';

/**
 * Horizontally scrollable strip of upcoming events — the ticketsmarche.com "Hot Events" pattern.
 * No autoplay, manual scroll only (matches reference). Snaps to each card on touch.
 */
const HotEventsCarousel = ({ events }) => {
    const scrollerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        const el = scrollerRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    useEffect(() => {
        checkScroll();
        const el = scrollerRef.current;
        if (!el) return undefined;
        el.addEventListener('scroll', checkScroll, { passive: true });
        window.addEventListener('resize', checkScroll);
        return () => {
            el.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [events.length]);

    const scrollBy = (direction) => {
        const el = scrollerRef.current;
        if (!el) return;
        const cardWidth = el.firstElementChild?.clientWidth || 280;
        el.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' });
    };

    if (!events?.length) return null;

    return (
        <section className="container-page pt-8 sm:pt-12">
            <div className="flex items-end justify-between gap-3 mb-5">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Hot Events</h2>
                    <p className="text-sm text-slate-500 mt-1">The most popular events happening in Berlin right now.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => scrollBy(-1)}
                        disabled={!canScrollLeft}
                        className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-primary-400 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={18} className="mx-auto" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollBy(1)}
                        disabled={!canScrollRight}
                        className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-primary-400 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={18} className="mx-auto" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
                style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
            >
                {events.map((event) => {
                    const minPrice = getMinPrice(event);
                    return (
                        <Link
                            to={`/events/${event._id}`}
                            key={event._id}
                            className="snap-start shrink-0 w-[260px] sm:w-[280px] group"
                        >
                            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-200 shadow-card group-hover:shadow-card-hover transition-shadow">
                                {event.image ? (
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Calendar size={56} strokeWidth={1.5} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                    {event.category && (
                                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-primary-500/90 px-2 py-0.5 rounded-full mb-2">
                                            {event.category}
                                        </span>
                                    )}
                                    <h3 className="font-bold text-base leading-snug line-clamp-2 text-white drop-shadow-md">{event.title}</h3>
                                    <div className="mt-1.5 flex items-center gap-3 text-xs text-white/90 drop-shadow">
                                        <span className="inline-flex items-center gap-1">
                                            <Calendar size={12} />
                                            {formatDateShort(event.date)}
                                        </span>
                                        <span className="inline-flex items-center gap-1 truncate">
                                            <MapPin size={12} />
                                            <span className="truncate">{event.location}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute top-3 right-3 bg-white/95 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                    From {formatPrice(minPrice)}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};

export default HotEventsCarousel;
