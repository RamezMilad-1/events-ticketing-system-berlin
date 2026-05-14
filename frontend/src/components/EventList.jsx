import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import EventCard from './EventCard';
import HotEventsCarousel from './HotEventsCarousel';
import CategoryTiles from './CategoryTiles';
import VenueGrid from './VenueGrid';
import Loader from './ui/Loader';
import EmptyState from './ui/EmptyState';
import { eventService } from '../services/api';
import { categoryOptions } from '../utils/categoryFields';
import { getMinPrice, getSoldCount } from '../utils/format';

const SORT_OPTIONS = [
    { value: 'date-asc', label: 'Date: Soonest first' },
    { value: 'date-desc', label: 'Date: Latest first' },
    { value: 'price-asc', label: 'Price: Low to high' },
    { value: 'price-desc', label: 'Price: High to low' },
    { value: 'newest', label: 'Recently added' },
];

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState(searchParams.get('category') || 'all');
    const [location, setLocation] = useState(searchParams.get('location') || '');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sort, setSort] = useState('date-asc');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await eventService.getAllEvents();
                setEvents(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch events');
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // Sync URL → state on navigation. Derive both values fully from the URL so that
    // clicking a category tile (?category=X) clears any prior location filter, and vice
    // versa for venue tiles (?location=Y). Without resetting missing params, the old
    // filter would stick in local state and silently combine with the new one.
    useEffect(() => {
        setCategory(searchParams.get('category') || 'all');
        setLocation(searchParams.get('location') || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const upcomingEvents = useMemo(
        () =>
            [...events]
                .filter((ev) => new Date(ev.date) >= new Date())
                .sort((a, b) => new Date(a.date) - new Date(b.date)),
        [events]
    );

    // Hot events: top 5 upcoming events by tickets sold. Falls back gracefully to
    // chronological order when no sales have happened yet (all sold counts are 0).
    const hotEvents = useMemo(
        () =>
            [...upcomingEvents]
                .sort((a, b) => getSoldCount(b) - getSoldCount(a))
                .slice(0, 5),
        [upcomingEvents]
    );

    const filteredEvents = useMemo(() => {
        const q = search.trim().toLowerCase();
        const loc = location.trim().toLowerCase();
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;
        if (to) to.setHours(23, 59, 59, 999);

        let list = events.filter((event) => {
            if (q && !event.title?.toLowerCase().includes(q) && !event.description?.toLowerCase().includes(q)) {
                return false;
            }
            if (category !== 'all' && event.category?.toLowerCase() !== category.toLowerCase()) return false;
            if (loc && !event.location?.toLowerCase().includes(loc)) return false;
            if (from && new Date(event.date) < from) return false;
            if (to && new Date(event.date) > to) return false;
            return true;
        });

        list.sort((a, b) => {
            switch (sort) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'price-asc':
                    return getMinPrice(a) - getMinPrice(b);
                case 'price-desc':
                    return getMinPrice(b) - getMinPrice(a);
                case 'newest':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'date-asc':
                default:
                    return new Date(a.date) - new Date(b.date);
            }
        });

        return list;
    }, [events, search, category, location, dateFrom, dateTo, sort]);

    const clearFilters = () => {
        setSearch('');
        setCategory('all');
        setLocation('');
        setDateFrom('');
        setDateTo('');
        setSort('date-asc');
        setSearchParams({});
    };

    const handleCategorySelect = (cat) => {
        // Reset every other filter so the user gets a clean view of just this category.
        // The URL-sync effect picks up the new params and overwrites local state for category/location.
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setSearchParams({ category: cat });
        setTimeout(() => {
            const grid = document.getElementById('event-grid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    const activeFilterCount =
        (search ? 1 : 0) +
        (category !== 'all' ? 1 : 0) +
        (location ? 1 : 0) +
        (dateFrom ? 1 : 0) +
        (dateTo ? 1 : 0);

    if (loading) return <Loader fullScreen label="Discovering events…" />;

    if (error) {
        return (
            <div className="container-page py-16 text-center">
                <p className="text-lg text-rose-600 font-semibold mb-2">Couldn't load events</p>
                <p className="text-slate-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Hot Events — top 5 upcoming events by tickets sold */}
            <HotEventsCarousel events={hotEvents} />

            {/* Category tiles */}
            <CategoryTiles events={events} onSelect={handleCategorySelect} />

            {/* All-events listing */}
            <section id="event-grid" className="container-page py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">All events</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
                            {category !== 'all' && (
                                <span> · <span className="font-semibold capitalize text-slate-700">{category}</span></span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search events…"
                                className="input pl-9 py-2 text-sm"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    aria-label="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="input py-2 text-sm w-auto"
                            aria-label="Sort events"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowFilters((s) => !s)}
                            className="btn btn-outline btn-sm shrink-0"
                        >
                            <SlidersHorizontal size={14} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={clearFilters}
                            disabled={activeFilterCount === 0}
                            className="btn btn-outline btn-sm shrink-0"
                            aria-label="Clear all filters"
                        >
                            <X size={14} />
                            Clear filters
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card animate-fade-in">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Category</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input py-2 text-sm">
                                    <option value="all">All categories</option>
                                    {categoryOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Venue / location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. Berghain"
                                    className="input py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">From</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="input py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">To</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="input py-2 text-sm"
                                />
                            </div>
                        </div>
                        {activeFilterCount > 0 && (
                            <div className="mt-4 flex justify-end">
                                <button onClick={clearFilters} className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredEvents.map((event) => (
                            <div key={event._id} className="animate-slideUp">
                                <EventCard event={event} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon="🎟️"
                        title="No events match your filters"
                        description={
                            activeFilterCount > 0
                                ? 'Try adjusting or clearing them to see all upcoming events.'
                                : 'There are no approved events at the moment. Please check back later.'
                        }
                        action={
                            activeFilterCount > 0 && (
                                <button onClick={clearFilters} className="btn btn-primary btn-sm">
                                    Clear filters
                                </button>
                            )
                        }
                    />
                )}
            </section>

            {/* Venues */}
            <VenueGrid events={events} />
        </div>
    );
};

export default EventList;
