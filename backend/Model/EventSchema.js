const mongoose = require('mongoose');

const TicketTypeSchema = new mongoose.Schema(
    {
        type: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 0 },
        remaining: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const EventSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        date: { type: Date, required: true },
        location: { type: String, required: true, trim: true },
        category: {
            type: String,
            enum: [
                'concert',
                'theater',
                'sports',
                'conference',
                'workshop',
                'party',
                'gaming',
                'food',
                'exhibition',
                'festival',
                'private',
                'virtual',
                'other',
            ],
            default: 'other',
            required: true,
        },
        image: { type: String, default: '' },

        // Multi-tier ticket types (custom feature, fully supported)
        ticketTypes: { type: [TicketTypeSchema], default: [] },

        // Legacy single-price fields kept in sync via pre-save hook for analytics & cards
        ticketPrice: { type: Number, min: 0 },
        totalTickets: { type: Number, min: 0 },
        remainingTickets: { type: Number, min: 0 },

        organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'declined'],
            default: 'pending',
            required: true,
        },
        custom_fields: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

// Keep legacy fields in sync with the multi-tier ticket types so analytics, EventList,
// and AdminEventsPage can rely on either set without divergence.
EventSchema.pre('save', function syncLegacyTicketFields(next) {
    if (Array.isArray(this.ticketTypes) && this.ticketTypes.length > 0) {
        const totalQty = this.ticketTypes.reduce((sum, t) => sum + (t.quantity || 0), 0);
        const totalRem = this.ticketTypes.reduce((sum, t) => sum + (t.remaining || 0), 0);
        const minPrice = this.ticketTypes.reduce(
            (min, t) => (typeof t.price === 'number' && t.price < min ? t.price : min),
            Infinity
        );

        this.totalTickets = totalQty;
        this.remainingTickets = totalRem;
        if (Number.isFinite(minPrice)) this.ticketPrice = minPrice;
    } else if (typeof this.totalTickets === 'number' && this.remainingTickets == null) {
        // First save with only legacy fields filled — initialize remaining
        this.remainingTickets = this.totalTickets;
    }
    next();
});

EventSchema.index({ status: 1, date: 1 });
EventSchema.index({ organizer: 1 });

const Event = mongoose.model('Event', EventSchema);
module.exports = Event;
