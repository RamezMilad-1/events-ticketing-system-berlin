const mongoose = require('mongoose');

const TicketBookingSchema = new mongoose.Schema(
    {
        ticketType: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const BookingSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },

        // Multi-tier breakdown (preferred)
        ticketBookings: { type: [TicketBookingSchema], default: [] },

        // Theater-specific (custom feature)
        selectedSeats: { type: [String], default: [] },

        // Legacy single-tier fields, kept for backward compat with older clients
        numberOfTickets: { type: Number, min: 1 },

        totalPrice: { type: Number, required: true, min: 0 },

        // Per Task 3 spec: booking status is only Confirmed or Canceled
        status: {
            type: String,
            enum: ['confirmed', 'canceled'],
            default: 'confirmed',
        },
    },
    { timestamps: true }
);

BookingSchema.index({ event: 1, status: 1 });
BookingSchema.index({ user: 1, status: 1 });

const Booking = mongoose.model('Booking', BookingSchema);
module.exports = Booking;
