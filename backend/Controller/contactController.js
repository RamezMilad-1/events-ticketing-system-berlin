const ContactMessage = require('../Model/ContactMessageSchema');

const ALLOWED_SUBJECTS = ['general', 'booking', 'organiser', 'press', 'bug'];
const ALLOWED_STATUSES = ['new', 'read', 'resolved'];

function isValidEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/v1/contact — public submission
exports.submitMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body || {};

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        }
        if (String(name).length > 120) {
            return res.status(400).json({ success: false, message: 'Name is too long.' });
        }
        if (String(message).trim().length < 5) {
            return res.status(400).json({ success: false, message: 'Please give us a bit more detail.' });
        }
        if (String(message).length > 4000) {
            return res.status(400).json({ success: false, message: 'Message is too long (max 4000 characters).' });
        }

        const finalSubject = ALLOWED_SUBJECTS.includes(subject) ? subject : 'general';

        const created = await ContactMessage.create({
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            subject: finalSubject,
            message: String(message).trim(),
        });

        return res.status(201).json({
            success: true,
            message: "Thanks! We've received your message and will reply within 1–2 business days.",
            id: created._id,
        });
    } catch (err) {
        console.error('contact submit error:', err);
        return res.status(500).json({ success: false, message: 'Could not send message. Please try again.' });
    }
};

// GET /api/v1/contact — admin: list all messages
exports.listMessages = async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
        return res.status(200).json({ success: true, count: messages.length, messages });
    } catch (err) {
        console.error('contact list error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /api/v1/contact/:id — admin: update status
exports.updateMessageStatus = async (req, res) => {
    try {
        const { status } = req.body || {};
        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}.` });
        }
        const updated = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Message not found.' });
        return res.status(200).json({ success: true, message: updated });
    } catch (err) {
        console.error('contact update error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /api/v1/contact/:id — admin: delete
exports.deleteMessage = async (req, res) => {
    try {
        const deleted = await ContactMessage.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Message not found.' });
        return res.status(200).json({ success: true, message: 'Message deleted.' });
    } catch (err) {
        console.error('contact delete error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
