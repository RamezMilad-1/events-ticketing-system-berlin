import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, X, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { eventService } from '../services/api';
import EventCard from '../components/EventCard';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';

const STORAGE_KEY = 'saved-events';

const readSavedIds = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY) || '[]';
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list.filter(Boolean) : [];
    } catch {
        return [];
    }
};

const writeSavedIds = (ids) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
        /* ignore quota errors */
    }
};

const SavedEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const ids = readSavedIds();
            if (ids.length === 0) {
                setEvents([]);
                setLoading(false);
                return;
            }

            // Fetch every saved event in parallel. Use allSettled so a 404
            // (event was deleted by admin) or 403 (event no longer approved)
            // doesn't blow up the whole page.
            const settled = await Promise.allSettled(ids.map((id) => eventService.getEventById(id)));

            const fetched = settled
                .map((r, i) => (r.status === 'fulfilled' ? { ...r.value.data, _savedId: ids[i] } : null))
                .filter(Boolean);

            // Prune the localStorage list of any IDs we couldn't fetch — keeps it tidy.
            const liveIds = new Set(fetched.map((e) => e._id));
            const prunedIds = ids.filter((id) => liveIds.has(id));
            if (prunedIds.length !== ids.length) {
                writeSavedIds(prunedIds);
            }

            setEvents(fetched);
            setLoading(false);
        };

        load();
    }, []);

    const handleUnsave = (eventId) => {
        const next = readSavedIds().filter((id) => id !== eventId);
        writeSavedIds(next);
        setEvents((prev) => prev.filter((e) => e._id !== eventId));
        toast.info('Removed from your saved events');
    };

    if (loading) return <Loader fullScreen label="Loading your saved events…" />;

    return (
        <div className="bg-surface-200/40 min-h-screen pb-16">
            {/* Hero */}
            <div className="bg-navy-700 text-white">
                <div className="container-page py-10 sm:py-14">
                    <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 flex items-center gap-3 text-white">
                        <Heart size={28} className="text-primary-400" fill="currentColor" />
                        Your saved events
                    </h1>
                    <p className="max-w-2xl text-white/80 text-sm sm:text-base">
                        Events you've saved with the ♥ button. Saved events are kept in this browser — sign in or use the same browser next time to find them again.
                    </p>
                </div>
            </div>

            <section className="container-page py-8 sm:py-10">
                {events.length === 0 ? (
                    <div className="max-w-xl mx-auto">
                        <EmptyState
                            icon="♥"
                            title="No saved events yet"
                            description="Tap the ♥ on any event you'd like to come back to — it'll show up here."
                        />
                        <div className="text-center mt-4">
                            <Link to="/" className="btn btn-primary">
                                Browse events <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-slate-500 mb-4">
                            {events.length} saved event{events.length === 1 ? '' : 's'}
                        </p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {events.map((event) => (
                                <SavedEventTile key={event._id} event={event} onUnsave={() => handleUnsave(event._id)} />
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
};

// Wraps EventCard with a small floating "Unsave" button so users can prune their list
// without having to open each event individually.
const SavedEventTile = ({ event, onUnsave }) => (
    <div className="relative group">
        <EventCard event={event} />
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUnsave();
            }}
            aria-label="Remove from saved"
            title="Remove from saved"
            className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/95 text-slate-700 hover:text-rose-600 hover:bg-white shadow-md border border-slate-200 transition opacity-90 hover:opacity-100"
        >
            <X size={15} />
        </button>
    </div>
);

export default SavedEvents;
