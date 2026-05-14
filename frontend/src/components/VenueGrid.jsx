import { MapPin } from 'lucide-react';

/**
 * Tile grid of unique venues, derived from the events list. Mirrors the venue thumbnail
 * grid on ticketsmarche.com. No new API call — purely derived.
 * Clicking a tile delegates to the parent via onSelect so the parent can also scroll
 * the page down to the All events section.
 */
const VenueGrid = ({ events = [], onSelect }) => {
    const venueMap = events.reduce((acc, ev) => {
        const name = ev.location?.trim();
        if (!name) return acc;
        const key = name.toLowerCase();
        if (!acc[key]) {
            acc[key] = { name, count: 0, image: ev.image };
        }
        acc[key].count += 1;
        if (!acc[key].image && ev.image) acc[key].image = ev.image;
        return acc;
    }, {});

    const venues = Object.values(venueMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);

    if (venues.length === 0) return null;

    return (
        <section className="container-page py-8 sm:py-10">
            <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Top venues in Berlin</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">From legendary clubs to historic concert halls.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {venues.map((venue) => (
                    <button
                        type="button"
                        key={venue.name}
                        onClick={() => onSelect?.(venue.name)}
                        className="group relative aspect-[5/4] rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow text-left"
                    >
                        {venue.image ? (
                            <img
                                src={venue.image}
                                alt={venue.name}
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-700" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/45 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 text-white">
                            <div className="flex items-start gap-1">
                                <MapPin size={12} className="mt-0.5 shrink-0 drop-shadow" />
                                <h3 className="font-bold text-xs sm:text-sm leading-snug line-clamp-2 text-white drop-shadow-md">{venue.name}</h3>
                            </div>
                            <p className="text-[11px] text-white/90 mt-0.5 drop-shadow">
                                {venue.count} {venue.count === 1 ? 'event' : 'events'}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
};

export default VenueGrid;
