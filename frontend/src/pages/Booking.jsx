import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { eventService, bookingService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';
import TheaterSeating from '../components/TheaterSeating';

const Booking = () => {
    const [event, setEvent] = useState(null);
    const [ticketSelections, setTicketSelections] = useState({});
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [bookedSeats, setBookedSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { eventId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const response = await eventService.getEventById(eventId);
                setEvent(response.data);

                // Fetch booked seats for theater events
                if (response.data.category === 'theater') {
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

                // Parse selected seats from URL parameters
                const selectedSeatsParam = searchParams.get('selectedSeats');
                if (selectedSeatsParam) {
                    const seats = selectedSeatsParam.split(',').filter(seat => seat.trim());
                    setSelectedSeats(seats);
                }

                // Initialize ticket selections based on event type
                if (response.data.category === 'theater') {
                    // Theater events use seat selection
                    setSelectedSeats(prev => {
                        const selectedSeatsParam = searchParams.get('selectedSeats');
                        if (selectedSeatsParam) {
                            const seats = selectedSeatsParam.split(',').filter(seat => seat.trim());
                            return seats;
                        }
                        return prev;
                    });
                } else if (response.data.ticketTypes && response.data.ticketTypes.length > 0) {
                    // Regular events with ticket types
                    const initialSelections = {};
                    response.data.ticketTypes.forEach(ticket => {
                        initialSelections[ticket.type] = 0;
                    });
                    setTicketSelections(initialSelections);
                }

                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch event details');
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId, searchParams]);

    const handleTicketQuantityChange = (ticketType, quantity) => {
        setTicketSelections(prev => ({
            ...prev,
            [ticketType]: Math.max(0, parseInt(quantity) || 0)
        }));
    };

    const handleSeatSelect = (seatId) => {
        setSelectedSeats(prev => {
            if (prev.includes(seatId)) {
                return prev.filter(id => id !== seatId);
            } else {
                return [...prev, seatId];
            }
        });
    };

    const calculateTotal = () => {
        if (!event) return 0;

        if (event.category === 'theater') {
            // For theater events, calculate based on selected seats and their ticket types
            return selectedSeats.reduce((total, seatId) => {
                const [row] = seatId.split('-');
                const rowNum = parseInt(row);
                const rows = event.custom_fields?.seating_rows || 10;
                
                // Determine ticket type based on row (same logic as TheaterSeating component)
                let ticketTypeIndex = 0;
                if (event.ticketTypes && event.ticketTypes.length > 1) {
                    if (rowNum <= Math.floor(rows * 0.3)) {
                        ticketTypeIndex = 0; // Front rows
                    } else if (rowNum <= Math.floor(rows * 0.7)) {
                        ticketTypeIndex = 1; // Middle rows
                    } else {
                        ticketTypeIndex = 2; // Back rows
                    }
                }
                
                const ticketPrice = event.ticketTypes?.[ticketTypeIndex]?.price || 50;
                return total + ticketPrice;
            }, 0);
        } else if (event.ticketTypes && event.ticketTypes.length > 0) {
            return event.ticketTypes.reduce((total, ticket) => {
                const quantity = ticketSelections[ticket.type] || 0;
                return total + (quantity * ticket.price);
            }, 0);
        } else {
            // Legacy system
            return (ticketSelections.legacy || 0) * event.ticketPrice;
        }
    };

    const getTotalTicketsSelected = () => {
        if (event?.category === 'theater') {
            return selectedSeats.length;
        }
        return Object.values(ticketSelections).reduce((sum, qty) => sum + qty, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const totalTickets = getTotalTicketsSelected();
        if (totalTickets === 0) {
            setError('Please select at least one seat or ticket.');
            return;
        }

        try {
            let bookingData;

            if (event.category === 'theater') {
                // Theater events: book specific seats with their ticket types
                const ticketBookings = [];
                const rows = event.custom_fields?.seating_rows || 10;
                
                // Group selected seats by ticket type
                const seatsByType = {};
                selectedSeats.forEach(seatId => {
                    const [row] = seatId.split('-');
                    const rowNum = parseInt(row);
                    
                    let ticketTypeIndex = 0;
                    if (event.ticketTypes && event.ticketTypes.length > 1) {
                        if (rowNum <= Math.floor(rows * 0.3)) {
                            ticketTypeIndex = 0; // Front rows
                        } else if (rowNum <= Math.floor(rows * 0.7)) {
                            ticketTypeIndex = 1; // Middle rows
                        } else {
                            ticketTypeIndex = 2; // Back rows
                        }
                    }
                    
                    const ticketType = event.ticketTypes?.[ticketTypeIndex]?.type || 'general';
                    if (!seatsByType[ticketType]) {
                        seatsByType[ticketType] = {
                            type: ticketType,
                            price: event.ticketTypes?.[ticketTypeIndex]?.price || 50,
                            seats: []
                        };
                    }
                    seatsByType[ticketType].seats.push(seatId);
                });
                
                // Create ticket bookings
                Object.values(seatsByType).forEach(typeData => {
                    ticketBookings.push({
                        ticketType: typeData.type,
                        quantity: typeData.seats.length,
                        price: typeData.price
                    });
                });

                bookingData = {
                    event: eventId,
                    ticketBookings,
                    selectedSeats // Store seat information
                };
            } else if (event.ticketTypes && event.ticketTypes.length > 0) {
                // Regular events with ticket types
                const ticketBookings = Object.entries(ticketSelections)
                    .filter(([_, quantity]) => quantity > 0)
                    .map(([ticketType, quantity]) => ({ ticketType, quantity }));

                bookingData = {
                    event: eventId,
                    ticketBookings
                };
            } else {
                // Legacy system
                bookingData = {
                    event: eventId,
                    numberOfTickets: ticketSelections.legacy || 0
                };
            }

            const response = await axios.post('http://localhost:3000/api/v1/bookings', bookingData, {
                withCredentials: true
            });

            if (response.data) {
                navigate('/booking-success');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to book tickets');
        }
    };

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
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-3xl font-bold mb-6">Book Tickets</h1>
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
                    <p className="text-gray-600">{event.description}</p>
                </div>
                <form onSubmit={handleSubmit}>
                    {event.category === 'theater' ? (
                        // Theater events: Seat selection
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">Select Your Seats</h3>
                            <TheaterSeating
                                event={event}
                                selectedSeats={selectedSeats}
                                onSeatSelect={handleSeatSelect}
                                maxSelectable={5}
                                bookedSeats={bookedSeats}
                            />
                        </div>
                    ) : event.ticketTypes && event.ticketTypes.length > 0 ? (
                        // Regular events: Multiple ticket types
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">Select Tickets</h3>
                            <div className="space-y-4">
                                {event.ticketTypes.map((ticket) => (
                                    <div key={ticket.type} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h4 className="font-medium">{ticket.type}</h4>
                                            <p className="text-sm text-gray-600">${ticket.price} each</p>
                                            <p className="text-xs text-gray-500">{ticket.remaining} available</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => handleTicketQuantityChange(ticket.type, (ticketSelections[ticket.type] || 0) - 1)}
                                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                                disabled={(ticketSelections[ticket.type] || 0) <= 0}
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                max={ticket.remaining}
                                                value={ticketSelections[ticket.type] || 0}
                                                onChange={(e) => handleTicketQuantityChange(ticket.type, e.target.value)}
                                                className="w-16 text-center border rounded px-2 py-1"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleTicketQuantityChange(ticket.type, (ticketSelections[ticket.type] || 0) + 1)}
                                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                                disabled={(ticketSelections[ticket.type] || 0) >= ticket.remaining}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Legacy system: Single ticket type
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Number of Tickets
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={event.remainingTickets}
                                value={ticketSelections.legacy || 0}
                                onChange={(e) => handleTicketQuantityChange('legacy', parseInt(e.target.value))}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </div>
                    )}

                    <div className="mb-6">
                        <p className="text-lg font-semibold">
                            Total Price: ${calculateTotal().toFixed(2)}
                        </p>
                        {getTotalTicketsSelected() > 0 && (
                            <p className="text-sm text-gray-600">
                                {event.category === 'theater' ? 'seats' : 'tickets'} selected
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300"
                        disabled={getTotalTicketsSelected() === 0}
                    >
                        Confirm Booking
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Booking; 