const mongoose = require('mongoose');
const Booking = require('../Model/BookingSchema');
const Event = require('../Model/EventSchema');

/**
 * Tries to run the work inside a Mongo transaction. If the deployment is a single-node
 * Mongo (no replica set), transactions aren't supported — fall back to a non-transactional
 * sequential execution. Either way, we end up doing availability check + decrement +
 * booking save together.
 */
async function withOptionalTransaction(fn) {
    let session = null;
    try {
        session = await mongoose.startSession();
    } catch (e) {
        // older drivers / no replica set — proceed without session
    }

    if (!session) return fn(null);

    try {
        let result;
        await session.withTransaction(async () => {
            result = await fn(session);
        });
        return result;
    } catch (e) {
        if (e?.code === 20 || /Transaction numbers are only allowed/i.test(e?.message || '')) {
            // standalone mongo — retry without transactions
            console.warn('[booking] transactions unsupported on this Mongo deployment, falling back');
            return fn(null);
        }
        throw e;
    } finally {
        await session.endSession();
    }
}

exports.bookAnEvent = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { event: eventId, numberOfTickets, ticketBookings, selectedSeats } = req.body;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID.' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }
        if (event.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'This event is not available for booking.' });
        }

        // Seat-conflict check for theater bookings
        if (Array.isArray(selectedSeats) && selectedSeats.length > 0) {
            const conflict = await Booking.findOne({
                event: eventId,
                status: 'confirmed',
                selectedSeats: { $in: selectedSeats },
            });
            if (conflict) {
                const taken = conflict.selectedSeats.filter((s) => selectedSeats.includes(s));
                return res.status(409).json({
                    success: false,
                    message: `Seats already booked: ${taken.join(', ')}`,
                });
            }
        }

        let totalPrice = 0;
        const bookingData = { user: userId, event: eventId };

        // --- Multi-tier ticket types path ---
        if (Array.isArray(ticketBookings) && ticketBookings.length > 0) {
            if (!event.ticketTypes || event.ticketTypes.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'This event does not have ticket types configured.',
                });
            }

            const processed = [];
            for (const booking of ticketBookings) {
                const { ticketType, quantity } = booking;
                const qty = Number(quantity);

                if (!ticketType || !qty || qty <= 0) {
                    return res.status(400).json({ success: false, message: 'Invalid ticket type or quantity.' });
                }

                const eventTicketType = event.ticketTypes.find((tt) => tt.type === ticketType);
                if (!eventTicketType) {
                    return res.status(400).json({
                        success: false,
                        message: `Unknown ticket type "${ticketType}".`,
                    });
                }
                if (eventTicketType.remaining < qty) {
                    return res.status(400).json({
                        success: false,
                        message: `Not enough "${ticketType}" tickets left. Available: ${eventTicketType.remaining}, requested: ${qty}.`,
                    });
                }

                processed.push({ ticketType, quantity: qty, price: eventTicketType.price });
                totalPrice += eventTicketType.price * qty;
                eventTicketType.remaining -= qty;
            }

            bookingData.ticketBookings = processed;
            bookingData.totalPrice = totalPrice;

        // --- Legacy single-tier path ---
        } else if (numberOfTickets != null) {
            const qty = Number(numberOfTickets);
            if (!qty || qty <= 0) {
                return res.status(400).json({ success: false, message: 'Number of tickets must be at least 1.' });
            }
            if (event.ticketTypes && event.ticketTypes.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'This event uses ticket types — please specify ticketBookings.',
                });
            }
            if ((event.remainingTickets || 0) < qty) {
                return res.status(400).json({ success: false, message: 'Not enough tickets available.' });
            }

            totalPrice = qty * (event.ticketPrice || 0);
            event.remainingTickets -= qty;
            bookingData.numberOfTickets = qty;
            bookingData.totalPrice = totalPrice;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Provide either ticketBookings or numberOfTickets.',
            });
        }

        if (Array.isArray(selectedSeats) && selectedSeats.length > 0) {
            bookingData.selectedSeats = selectedSeats;
        }

        const booking = await withOptionalTransaction(async (session) => {
            const created = await Booking.create(
                [{ ...bookingData, status: 'confirmed' }],
                session ? { session } : undefined
            );
            await event.save(session ? { session } : undefined);
            return created[0];
        });

        return res.status(201).json({ success: true, message: 'Booking successful', booking });
    } catch (err) {
        console.error('Booking error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/v1/bookings/:id (own only)
exports.getBookingById = async (req, res) => {
    try {
        const bookingId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
        }

        const booking = await Booking.findOne({ _id: bookingId, user: req.user.userId }).populate('event');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        return res.status(200).json({ success: true, booking });
    } catch (err) {
        console.error('Error fetching booking:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// DELETE /api/v1/bookings/:id — cancel and RETURN tickets (per spec)
exports.cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
        }

        const booking = await Booking.findOne({ _id: bookingId, user: req.user.userId });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        if (booking.status === 'canceled') {
            return res.status(400).json({ success: false, message: 'Booking is already canceled.' });
        }

        const event = await Event.findById(booking.event);

        await withOptionalTransaction(async (session) => {
            // Return tickets to inventory (spec: deletion increases ticket count)
            if (event) {
                if (Array.isArray(booking.ticketBookings) && booking.ticketBookings.length > 0) {
                    booking.ticketBookings.forEach((tb) => {
                        const tt = event.ticketTypes.find((t) => t.type === tb.ticketType);
                        if (tt) {
                            tt.remaining = (tt.remaining || 0) + (tb.quantity || 0);
                            if (tt.remaining > tt.quantity) tt.remaining = tt.quantity;
                        }
                    });
                } else if (booking.numberOfTickets) {
                    event.remainingTickets = (event.remainingTickets || 0) + booking.numberOfTickets;
                    if (typeof event.totalTickets === 'number' && event.remainingTickets > event.totalTickets) {
                        event.remainingTickets = event.totalTickets;
                    }
                }
                await event.save(session ? { session } : undefined);
            }

            booking.status = 'canceled';
            await booking.save(session ? { session } : undefined);
        });

        return res.status(200).json({ success: true, message: 'Booking canceled successfully.', booking });
    } catch (err) {
        console.error('Error canceling booking:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// GET /api/v1/bookings/event/:eventId — used by theater seat picker to know which seats are taken.
// Authenticated; returns minimal info (only seat strings + status).
exports.getBookingsForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID.' });
        }

        const bookings = await Booking.find({
            event: eventId,
            status: 'confirmed',
        }).select('selectedSeats status');

        return res.status(200).json(bookings);
    } catch (err) {
        console.error('Error fetching bookings for event:', err);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
