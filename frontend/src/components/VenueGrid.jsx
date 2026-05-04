import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

/**
 * Tile grid of unique venues, derived from the events list. Mirrors the venue thumbnail
 * grid on ticketsmarche.com. No new API call — purely derived.
 */
const VenueGrid = ({ events = [] }) => {
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
        <section className="container-page py-12 sm:py-16">
            <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Top venues in Berlin</h2>
                <p className="text-sm text-slate-500 mt-1">From legendary clubs to historic concert halls.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {venues.map((venue) => (
                    <Link
                        key={venue.name}
                        to={`/?location=${encodeURIComponent(venue.name)}`}
                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
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
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
                            <div className="flex items-start gap-1.5">
                                <MapPin size={14} className="mt-0.5 shrink-0" />
                                <h3 className="font-bold text-sm sm:text-base leading-snug line-clamp-2">{venue.name}</h3>
                            </div>
                            <p className="text-xs text-white/80 mt-1">
                                {venue.count} {venue.count === 1 ? 'event' : 'events'}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default VenueGrid;
