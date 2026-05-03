import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService, bookingService } from '../services/api';
import SeatSelectionModal from './SeatSelectionModal';

const EventDetails = () => {
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookedSeats, setBookedSeats] = useState([]);
    const { eventId } = useParams();
    const navigate = useNavigate();
    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/my-bookings');
        }
    };

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const eventResponse = await eventService.getEventById(eventId);
                setEvent(eventResponse.data);

                // Fetch booked seats for theater events
                if (eventResponse.data.category === 'theater') {
                    try {
                        const bookingsResponse = await bookingService.getBookingsForEvent(eventId);
                        const bookedSeatsList = bookingsResponse.data
                            .filter(booking => booking.selectedSeats && booking.status !== 'canceled')
                            .flatMap(booking => booking.selectedSeats);
                        setBookedSeats(bookedSeatsList);
                    } catch (bookingError) {
                        console.log('No bookings found or error fetching bookings:', bookingError);
                        setBookedSeats([]);
                    }
                }

                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch event details');
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-600 p-4">
                Error: {error}
            </div>
        );
    }

    if (!event) {
        return (
            <div className="text-center p-4">
                Event not found
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-96 object-cover"
                />
                <div className="p-6">
                    <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Event Details</h2>
                            <p className="text-gray-600 mb-4">{event.description}</p>
                            <div className="space-y-2">
                                <p><span className="font-semibold">Date:</span> {new Date(event.date).toLocaleDateString()}</p>
                                <p><span className="font-semibold">Location:</span> {event.location}</p>
                                <p><span className="font-semibold">Category:</span> {event.category}</p>

                                {/* Ticket Information */}
                                {event.ticketTypes && event.ticketTypes.length > 0 ? (
                                    <div className="mt-4">
                                        <p className="font-semibold mb-2">Ticket Types:</p>
                                        <div className="space-y-1">
                                            {event.ticketTypes.map((ticket, index) => (
                                                <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                                    <span className="font-medium">{ticket.type}</span>
                                                    <div className="text-right">
                                                        <span className="font-semibold text-green-600">${ticket.price}</span>
                                                        <span className="text-sm text-gray-500 ml-2">
                                                            ({ticket.remaining}/{ticket.quantity} available)
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {event.category === 'theater' && event.custom_fields && (
                                            <p className="text-sm text-gray-600 mt-2">
                                                Total Seats: {(event.custom_fields.seating_rows || 10) * (event.custom_fields.seating_columns || 20)}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <p><span className="font-semibold">Price:</span> ${event.ticketPrice}</p>
                                        <p><span className="font-semibold">Available Tickets:</span> {event.remainingTickets}</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Theater Seat Selection */}
                        {event.category === 'theater' && event.custom_fields && event.custom_fields.seating_rows && (
                            <div className="mt-8">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                                >
                                    Select Seats
                                </button>
                                <p className="text-sm text-gray-600 mt-2">
                                    Choose your preferred seats for this theater event.
                                </p>
                            </div>
                        )}

                        {/* Custom Fields Display */}
                        {event.custom_fields && Object.keys(event.custom_fields).length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold mb-2">Additional Details</h2>
                                <div className="space-y-2">
                                    {Object.entries(event.custom_fields).map(([key, value]) => {
                                        if (!value || (Array.isArray(value) && value.length === 0)) return null;

                                        const formatValue = (val) => {
                                            if (Array.isArray(val)) {
                                                // Check if it's an array of objects (like lineup_schedule)
                                                if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
                                                    // Handle object arrays like lineup_schedule
                                                    return val.map(obj => {
                                                        if (obj.artist && obj.time) {
                                                            // Special formatting for lineup schedule
                                                            return `${obj.artist} at ${obj.time}`;
                                                        } else {
                                                            // Generic object formatting
                                                            return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ');
                                                        }
                                                    }).join('; ');
                                                } else {
                                                    // Handle simple arrays
                                                    return val.join(', ');
                                                }
                                            }
                                            if (typeof val === 'boolean') {
                                                return val ? 'Yes' : 'No';
                                            }
                                            if (typeof val === 'object' && val !== null) {
                                                // Handle single objects
                                                return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(', ');
                                            }
                                            return val;
                                        };

                                        return (
                                            <p key={key}>
                                                <span className="font-semibold capitalize">
                                                    {key.replace(/_/g, ' ')}:
                                                </span>{' '}
                                                {formatValue(value)}
                                            </p>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mb-4">
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>

            {/* Seat Selection Modal */}
            <SeatSelectionModal
                event={event}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                bookedSeats={bookedSeats}
            />
        </div>
    );
};

export default EventDetails; 