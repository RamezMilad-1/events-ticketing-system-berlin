const mongoose = require("mongoose");

// Event Schema
const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    category: { 
        type: String, 
        enum: ['concert', 'theater', 'sports', 'conference', 'workshop', 'party', 'gaming', 'food', 'exhibition', 'festival', 'private', 'virtual', 'other'], 
        default: 'other',
        required: true 
    },
    image: { type: String },
    ticketTypes: [{
        type: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        remaining: { type: Number, required: true }
    }],
    // Keep legacy fields for backward compatibility
    ticketPrice: { type: Number },
    totalTickets: { type: Number },
    remainingTickets: { type: Number },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending', required: true },
    custom_fields: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const Event = mongoose.model("Event", EventSchema);
module.exports = Event;