import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Flame } from 'lucide-react';
import {
    formatDate,
    formatDateShort,
    formatPrice,
    formatPriceRange,
    getMinPrice,
    getMaxPrice,
    getAvailableTickets,
} from '../utils/format';

const EventCard = ({ event }) => {
    const date = new Date(event.date);
    const formattedDate = formatDate(date);

    const daysUntilEvent = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
    const isEndingSoon = daysUntilEvent > 0 && daysUntilEvent <= 7;

    const min = getMinPrice(event);
    const max = getMaxPrice(event);
    const priceDisplay = min === max ? formatPrice(min) : `from ${formatPrice(min)}`;
    const priceTooltip = min === max ? formatPrice(min) : formatPriceRange(min, max);

    const availableTickets = getAvailableTickets(event);
    const isSoldOut = availableTickets === 0;

    return (
        <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200/70 shadow-card hover:shadow-card-hover transition-shadow duration-200">
            {/* Poster */}
            <Link to={`/events/${event._id}`} className="relative block aspect-[4/3] overflow-hidden bg-surface-200">
                {event.image ? (
                    <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Calendar size={40} strokeWidth={1.5} />
                    </div>
                )}

                {/* Top-right badges (stack: sold-out / ending-soon / price chip) */}
                <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
                    {isSoldOut ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-900/85 text-white backdrop-blur">
                            Sold out
                        </span>
                    ) : (
                        <span title={priceTooltip} className="bg-white/95 text-slate-900 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            {priceDisplay}
                        </span>
                    )}
                    {!isSoldOut && isEndingSoon && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-500 text-white shadow-sm">
                            <Flame size={10} /> Ending soon
                        </span>
                    )}
                </div>

                {/* Bottom-left single-line date chip */}
                <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur rounded-full shadow-sm px-2.5 py-0.5">
                    <p className="text-[11px] font-bold text-slate-900 leading-none">
                        {formatDateShort(date)}
                    </p>
                </div>
            </Link>

            {/* Body */}
            <div className="flex flex-col flex-grow p-3">
                {event.category && (
                    <span className="inline-flex self-start text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full mb-1.5">
                        {event.category}
                    </span>
                )}

                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
                    <Link to={`/events/${event._id}`}>{event.title}</Link>
                </h3>

                <div className="mt-1.5 space-y-0.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">{event.location}</span>
                    </div>
                </div>

                {/* Spacer pushes CTA down */}
                <div className="flex-grow" />

                <div className="mt-3 pt-2.5 border-t border-slate-100/70">
                    <Link
                        to={`/events/${event._id}`}
                        className={`btn btn-sm w-full ${isSoldOut ? 'btn-outline cursor-not-allowed opacity-70' : 'btn-primary'}`}
                        onClick={(e) => isSoldOut && e.preventDefault()}
                    >
                        {isSoldOut ? 'Sold out' : 'Book now'}
                    </Link>
                </div>
            </div>
        </article>
    );
};

export default EventCard;
