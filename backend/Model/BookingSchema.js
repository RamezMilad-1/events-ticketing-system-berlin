
const mongoose = require("mongoose");


const BookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    ticketBookings: [{
        ticketType: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    selectedSeats: [{ type: String }], // For theater events
    numberOfTickets: { type: Number },
    totalPrice: { type: Number },
    status: { type: String, enum: ["pending", "confirmed", "canceled"], default: "confirmed" },
}, { timestamps: true });

const Booking = mongoose.model("Booking", BookingSchema);

module.exports = Booking;