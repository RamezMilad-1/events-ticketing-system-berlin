import React, { useState, useEffect } from 'react';
import EventCard from './EventCard';
import { eventService } from '../services/api';
import { useAuth } from '../auth/AuthContext';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const { user } = useAuth();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await eventService.getAllEvents();
                setEvents(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch events');
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event => {
        if (filter === 'all') return true;
        return event.category?.toLowerCase() === filter.toLowerCase();
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[600px]">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-red-600 font-semibold mb-4">⚠️ {error}</p>
                    <p className="text-slate-600">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="gradient-bg py-16 sm:py-24 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl sm:text-6xl font-bold mb-4">
                        Discover Amazing Events
                    </h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        Find and book tickets for the best events happening near you
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header with Count */}
                <div className="mb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">
                                {filteredEvents.length} Events Available
                            </h2>
                            <p className="text-slate-600">
                                {filteredEvents.length === 0 
                                    ? 'No events found' 
                                    : `Browse and book your favorite events`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Events Grid */}
                {filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredEvents.map((event) => (
                            <div key={event._id} className="animate-slideUp">
                                <EventCard event={event} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No Events Found</h3>
                        <p className="text-slate-600">Check back later for new events</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventList; 