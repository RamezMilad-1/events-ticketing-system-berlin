const Booking = require('../Model/BookingSchema');
const Event = require('../Model/EventSchema');
const mongoose = require('mongoose');

exports.bookAnEvent = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { event: eventId, numberOfTickets, ticketBookings, selectedSeats } = req.body;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid event ID." });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        // For theater events, ensure ticketTypes exist
        if (event.category === 'theater' && (!event.ticketTypes || event.ticketTypes.length === 0)) {
            // Create default ticket types for theater events
            const totalSeats = (event.custom_fields?.seating_rows || 10) * (event.custom_fields?.seating_columns || 20);
            event.ticketTypes = [
                { type: 'orchestra', price: 150, quantity: Math.floor(totalSeats * 0.3), remaining: Math.floor(totalSeats * 0.3) },
                { type: 'mezzanine', price: 100, quantity: Math.floor(totalSeats * 0.4), remaining: Math.floor(totalSeats * 0.4) },
                { type: 'balcony', price: 75, quantity: Math.floor(totalSeats * 0.3), remaining: Math.floor(totalSeats * 0.3) }
            ];
            await event.save(); // Save the updated event
        }

        // For theater events, validate selected seats are not already booked
        // Temporarily disabled for debugging
        /*
        if (selectedSeats && Array.isArray(selectedSeats) && selectedSeats.length > 0) {
            try {
                // Check each selected seat individually
                for (const seatId of selectedSeats) {
                    const existingBooking = await Booking.findOne({ 
                        event: eventId, 
                        status: { $ne: 'canceled' },
                        selectedSeats: seatId
                    });
                    
                    if (existingBooking) {
                        return res.status(400).json({ message: `Seat ${seatId} is already booked.` });
                    }
                }
            } catch (dbError) {
                console.error("Database error checking seat availability:", dbError);
                // Continue without seat validation for now
                console.log("Continuing without seat validation due to database error");
            }
        }
        */

        let totalPrice = 0;
        let bookingData = {};

        // Handle new ticket types system
        if (ticketBookings && Array.isArray(ticketBookings)) {
            if (ticketBookings.length === 0) {
                return res.status(400).json({ message: "At least one ticket type must be selected." });
            }

            const processedBookings = [];
            for (const booking of ticketBookings) {
                const { ticketType, quantity } = booking;

                if (!ticketType || !quantity || quantity <= 0) {
                    return res.status(400).json({ message: "Invalid ticket type or quantity." });
                }

                // Find the ticket type in event.ticketTypes
                let eventTicketType = event.ticketTypes.find(tt => tt.type === ticketType);
                
                // If not found, try to find by index or create a default
                if (!eventTicketType && event.ticketTypes && event.ticketTypes.length > 0) {
                    // For theater events, map common names
                    const typeMapping = {
                        'orchestra': ['orchestra', 'front', 'vip'],
                        'mezzanine': ['mezzanine', 'middle', 'standard'],
                        'balcony': ['balcony', 'back', 'economy'],
                        'general': ['general', 'regular', 'standard']
                    };
                    
                    for (const [standardType, aliases] of Object.entries(typeMapping)) {
                        if (aliases.includes(ticketType.toLowerCase())) {
                            eventTicketType = event.ticketTypes.find(tt => tt.type === standardType);
                            break;
                        }
                    }
                }
                
                // If still not found, use the first available ticket type
                if (!eventTicketType && event.ticketTypes && event.ticketTypes.length > 0) {
                    eventTicketType = event.ticketTypes[0];
                }
                
                // If no ticket types at all, create a default one
                if (!eventTicketType) {
                    event.ticketTypes = [{
                        type: 'general',
                        price: 50,
                        quantity: 1000,
                        remaining: 1000
                    }];
                    eventTicketType = event.ticketTypes[0];
                    await event.save(); // Save the updated event
                }

                if (eventTicketType.remaining < quantity) {
                    return res.status(400).json({ message: `Not enough tickets available for '${ticketType}'. Available: ${eventTicketType.remaining}, Requested: ${quantity}` });
                }

                const price = eventTicketType.price * quantity;
                totalPrice += price;

                processedBookings.push({
                    ticketType,
                    quantity: Number(quantity),
                    price: eventTicketType.price
                });

                // Update remaining tickets
                eventTicketType.remaining -= quantity;
            }

            bookingData.ticketBookings = processedBookings;
            bookingData.totalPrice = totalPrice;

        // Handle legacy system (backward compatibility)
        } else if (numberOfTickets) {
            if (numberOfTickets <= 0) {
                return res.status(400).json({ message: "Invalid number of tickets." });
            }

            // Check if event has legacy ticket fields
            if (!event.ticketPrice || !event.remainingTickets) {
                return res.status(400).json({ message: "This event uses the new ticket type system. Please specify ticketBookings." });
            }

            if (event.remainingTickets < numberOfTickets) {
                return res.status(400).json({ message: "Not enough tickets available." });
            }

            totalPrice = numberOfTickets * event.ticketPrice;
            event.remainingTickets -= numberOfTickets;

            bookingData.numberOfTickets = numberOfTickets;
            bookingData.totalPrice = totalPrice;
        } else {
            return res.status(400).json({ message: "Either ticketBookings or numberOfTickets must be provided." });
        }

        // Include selectedSeats if provided
        if (selectedSeats && Array.isArray(selectedSeats)) {
            bookingData.selectedSeats = selectedSeats;
        }

        const booking = new Booking({
            user: userId,
            event: eventId,
            ...bookingData
        });

        console.log("Creating booking with data:", bookingData);
        await booking.save();
        console.log("Booking saved successfully");
        
        await event.save(); // Save the updated remaining tickets
        console.log("Event saved successfully");

        return res.status(201).json({ message: "Booking successful!", booking });
    } catch (err) {
        console.error("Booking error:", err);
        console.error("Error stack:", err.stack);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation error: " + err.message });
        }
        return res.status(500).json({ message: "Internal server error: " + err.message });
    }
};

// GET /api/v1/bookings/:id
exports.getBookingById = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: "Invalid booking ID." });
        }

        const booking = await Booking.findOne({ _id: bookingId, user: userId }).populate("event");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        return res.status(200).json({ booking });
    } catch (err) {
        console.error("Error fetching booking:", err);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// DELETE /api/v1/bookings/:id - Cancel a booking for the authenticated user
exports.cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: "Invalid booking ID." });
        }

        const booking = await Booking.findOne({ _id: bookingId, user: userId });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        if (booking.status === 'canceled') {
            return res.status(400).json({ message: "Booking is already canceled." });
        }

        booking.status = 'canceled';
        await booking.save();

        return res.status(200).json({ success: true, message: "Booking canceled successfully.", booking });
    } catch (err) {
        console.error("Error canceling booking:", err);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// GET /api/v1/bookings/event/:eventId - Get all bookings for an event (for seat availability)
exports.getBookingsForEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid event ID." });
        }

        const bookings = await Booking.find({ 
            event: eventId, 
            status: { $ne: 'canceled' } 
        }).select('selectedSeats status');

        return res.status(200).json(bookings);
    } catch (err) {
        console.error("Error fetching bookings for event:", err);
        return res.status(500).json({ message: "Internal server error." });
    }
};