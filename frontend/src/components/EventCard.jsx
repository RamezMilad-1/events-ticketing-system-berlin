import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Flame } from 'lucide-react';
import {
    formatDate,
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
        <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200/70 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
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
                        <Calendar size={48} strokeWidth={1.5} />
                    </div>
                )}

                {/* Top-right badges */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    {isSoldOut && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-slate-900/85 text-white backdrop-blur">
                            Sold out
                        </span>
                    )}
                    {!isSoldOut && isEndingSoon && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-500 text-white shadow-sm">
                            <Flame size={12} /> Ending soon
                        </span>
                    )}
                </div>

                {/* Bottom-left date pill */}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-lg shadow-sm px-2.5 py-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600 leading-none">
                        {date.toLocaleDateString('en-GB', { month: 'short' })}
                    </p>
                    <p className="text-base font-bold text-slate-900 leading-none mt-0.5">
                        {date.toLocaleDateString('en-GB', { day: '2-digit' })}
                    </p>
                </div>
            </Link>

            {/* Body */}
            <div className="flex flex-col flex-grow p-4">
                {event.category && (
                    <span className="inline-flex self-start text-[11px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full mb-2">
                        {event.category}
                    </span>
                )}

                <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
                    <Link to={`/events/${event._id}`}>{event.title}</Link>
                </h3>

                <div className="mt-2 space-y-1 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="shrink-0 text-slate-400" />
                        <span className="truncate">{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="shrink-0 text-slate-400" />
                        <span className="truncate">{event.location}</span>
                    </div>
                </div>

                {/* Spacer pushes footer down */}
                <div className="flex-grow" />

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
                    <div title={priceTooltip}>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">From</p>
                        <p className="text-lg font-bold text-slate-900">{priceDisplay}</p>
                    </div>
                    <Link
                        to={`/events/${event._id}`}
                        className={`btn btn-sm ${isSoldOut ? 'btn-outline cursor-not-allowed opacity-70' : 'btn-primary'}`}
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
