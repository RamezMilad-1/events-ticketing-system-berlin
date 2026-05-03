import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import EventCard from './EventCard';
import Loader from './ui/Loader';
import EmptyState from './ui/EmptyState';
import { eventService } from '../services/api';
import { categoryOptions } from '../utils/categoryFields';

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

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [location, setLocation] = useState('');
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

    const filteredEvents = useMemo(() => {
        const q = search.trim().toLowerCase();
        const loc = location.trim().toLowerCase();
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;
        if (to) to.setHours(23, 59, 59, 999);

        const getMinPrice = (event) => {
            if (event.ticketTypes?.length > 0) {
                return Math.min(...event.ticketTypes.map((t) => t.price));
            }
            return event.ticketPrice || 0;
        };

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
    };

    const activeFilterCount =
        (search ? 1 : 0) +
        (category !== 'all' ? 1 : 0) +
        (location ? 1 : 0) +
        (dateFrom ? 1 : 0) +
        (dateTo ? 1 : 0);

    if (loading) return <Loader fullScreen label="Discovering amazing events..." />;

    if (error) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-red-600 font-semibold mb-4">⚠️ {error}</p>
                    <p className="text-slate-600">Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <div className="gradient-bg py-16 sm:py-24 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl sm:text-6xl font-bold mb-4">Discover Amazing Events</h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        Find and book tickets for the best events happening near you
                    </p>

                    {/* Search bar */}
                    <div className="mt-8 max-w-2xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search events by name or description..."
                                className="w-full rounded-full bg-white/95 px-14 py-4 text-base text-slate-900 placeholder:text-slate-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    aria-label="Clear search"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">
                            {filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'} found
                        </h2>
                        <p className="text-slate-600 mt-1">
                            {filteredEvents.length === 0
                                ? 'No events match your filters'
                                : 'Browse and book your next experience'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="input py-2 text-sm"
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
                            className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition"
                        >
                            <Filter size={16} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-indigo-600 px-2 text-xs font-bold text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="City, venue..."
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
                                <button
                                    onClick={clearFilters}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Grid */}
                {filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredEvents.map((event) => (
                            <div key={event._id} className="animate-slideUp">
                                <EventCard event={event} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon="🎟️"
                        title="No events found"
                        description={
                            activeFilterCount > 0
                                ? 'Try adjusting your filters or clearing them to see all events.'
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
            </div>
        </div>
    );
};

export default EventList;
