const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
        subject: {
            type: String,
            enum: ['general', 'booking', 'organiser', 'press', 'bug'],
            default: 'general',
        },
        message: { type: String, required: true, trim: true, maxlength: 4000 },
        status: {
            type: String,
            enum: ['new', 'read', 'resolved'],
            default: 'new',
        },
    },
    { timestamps: true }
);

ContactMessageSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
