const Event = require('../Model/EventSchema');
const { validateCustomFields } = require('../utils/categoryFields');

// Fields organizers may edit (per spec). Admins can additionally edit anything.
const ORGANIZER_EDITABLE = new Set([
    'date',
    'location',
    'totalTickets',
    'ticketTypes',
    // practical extras kept for UX
    'description',
    'image',
    'custom_fields',
]);

// Fields admins can also edit beyond organizer set
const ADMIN_EDITABLE = new Set([
    ...ORGANIZER_EDITABLE,
    'title',
    'category',
    'ticketPrice',
    'status',
]);

function processTicketTypes(ticketTypes) {
    if (!Array.isArray(ticketTypes) || ticketTypes.length === 0) return [];
    return ticketTypes.map((tt) => {
        const quantity = Number(tt.quantity) || 0;
        return {
            type: String(tt.type || 'general'),
            price: Number(tt.price) || 0,
            quantity,
            // when "remaining" is unspecified (creation), match quantity
            remaining: tt.remaining !== undefined ? Number(tt.remaining) : quantity,
        };
    });
}

// Create a new event (Organizer only)
exports.createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            date,
            location,
            category,
            image,
            ticketTypes,
            ticketPrice,
            totalTickets,
            custom_fields,
        } = req.body;

        if (!title || !description || !date || !location || !category) {
            return res.status(400).json({
                success: false,
                message: 'title, description, date, location, and category are required.',
            });
        }

        // For theater events, auto-fill seating dimensions if the organizer didn't specify them.
        // Derive a near-square grid from total ticket count so every ticket has a seat.
        let workingCustomFields = custom_fields ? { ...custom_fields } : {};
        if (category === 'theater') {
            const hasRows = Number(workingCustomFields.seating_rows) > 0;
            const hasCols = Number(workingCustomFields.seating_columns) > 0;
            if (!hasRows || !hasCols) {
                const totalSeats =
                    (Array.isArray(ticketTypes) && ticketTypes.length > 0
                        ? ticketTypes.reduce((s, t) => s + (Number(t.quantity) || 0), 0)
                        : Number(totalTickets) || 0) || 200;
                const cols = Math.max(6, Math.ceil(Math.sqrt(totalSeats * 1.4)));
                const rows = Math.max(3, Math.ceil(totalSeats / cols));
                if (!hasRows) workingCustomFields.seating_rows = rows;
                if (!hasCols) workingCustomFields.seating_columns = cols;
            }
        }

        if (Object.keys(workingCustomFields).length > 0) {
            const validationErrors = validateCustomFields(category, workingCustomFields);
            if (validationErrors.length > 0) {
                return res.status(400).json({ success: false, message: 'Validation errors', errors: validationErrors });
            }
        }

        let processedTicketTypes = processTicketTypes(ticketTypes);

        // Fallback: if organizer provided legacy ticketPrice/totalTickets, build a single tier
        if (processedTicketTypes.length === 0 && ticketPrice && totalTickets) {
            processedTicketTypes = [
                {
                    type: 'general',
                    price: Number(ticketPrice),
                    quantity: Number(totalTickets),
                    remaining: Number(totalTickets),
                },
            ];
        }

        if (processedTicketTypes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one ticket type (or ticketPrice + totalTickets) is required.',
            });
        }

        // For theater events, gently ensure the seating capacity matches ticket totals
        if (category === 'theater') {
            const totalSeats =
                (Number(workingCustomFields.seating_rows) || 10) * (Number(workingCustomFields.seating_columns) || 20);
            const totalTicketQty = processedTicketTypes.reduce((sum, t) => sum + t.quantity, 0);
            if (totalTicketQty > totalSeats) {
                const scale = totalSeats / totalTicketQty;
                processedTicketTypes = processedTicketTypes.map((t) => ({
                    ...t,
                    quantity: Math.floor(t.quantity * scale),
                    remaining: Math.floor(t.quantity * scale),
                }));
            } else if (processedTicketTypes.length === 1 && processedTicketTypes[0].type === 'general') {
                // single-tier theater — fill the room
                processedTicketTypes[0].quantity = totalSeats;
                processedTicketTypes[0].remaining = totalSeats;
            }
        }

        const event = await Event.create({
            title,
            description,
            date,
            location,
            category,
            image: image || '',
            ticketTypes: processedTicketTypes,
            organizer: req.user.userId,
            status: 'pending',
            custom_fields: workingCustomFields,
        });

        return res.status(201).json({ success: true, event });
    } catch (err) {
        console.error('createEvent error:', err);
        return res.status(400).json({ success: false, message: err.message });
    }
};

// Get all approved events (Public)
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({ status: 'approved' })
            .populate('organizer', 'name email')
            .sort({ date: 1 });
        return res.status(200).json(events);
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get all events (Admin only)
exports.getAllEventsAdmin = async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organizer', 'name email')
            .sort({ createdAt: -1 });
        return res.status(200).json(events);
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get single event by ID
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'name email');
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        // Approved events are public. Pending/declined visible only to admin or the owning organizer.
        if (event.status !== 'approved') {
            const isAdmin = req.user?.role === 'System Admin';
            const isOwner = req.user && event.organizer && event.organizer._id?.toString() === req.user.userId;
            if (!isAdmin && !isOwner) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }

        return res.status(200).json(event);
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Update an event (Organizer for own events, Admin for any)
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        const isAdmin = req.user.role === 'System Admin';
        const isOwner = event.organizer.toString() === req.user.userId;
        if (!isAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
        }

        if (req.body.custom_fields) {
            const validationErrors = validateCustomFields(
                req.body.category || event.category,
                req.body.custom_fields
            );
            if (validationErrors.length > 0) {
                return res.status(400).json({ success: false, message: 'Validation errors', errors: validationErrors });
            }
        }

        const allowed = isAdmin ? ADMIN_EDITABLE : ORGANIZER_EDITABLE;

        for (const field of Object.keys(req.body)) {
            if (!allowed.has(field)) continue;

            if (field === 'ticketTypes' && Array.isArray(req.body.ticketTypes)) {
                // Preserve remaining counts where possible (don't reset already-sold tickets)
                const incoming = processTicketTypes(req.body.ticketTypes);
                event.ticketTypes = incoming.map((tt) => {
                    const existing = event.ticketTypes.find((e) => e.type === tt.type);
                    if (existing) {
                        const sold = (existing.quantity || 0) - (existing.remaining || 0);
                        const newRemaining = Math.max(0, tt.quantity - sold);
                        return { ...tt, remaining: newRemaining };
                    }
                    return tt;
                });
            } else if (field === 'totalTickets' && (!event.ticketTypes || event.ticketTypes.length === 0)) {
                // Legacy single-tier path
                const newTotal = Number(req.body.totalTickets) || 0;
                const sold = (event.totalTickets || 0) - (event.remainingTickets || 0);
                event.totalTickets = newTotal;
                event.remainingTickets = Math.max(0, newTotal - sold);
            } else {
                event[field] = req.body[field];
            }
        }

        // Organizer edits push the event back into review (per spec)
        if (!isAdmin) {
            event.status = 'pending';
        }

        await event.save();
        return res.status(200).json({ success: true, event });
    } catch (err) {
        console.error('updateEvent error:', err);
        return res.status(400).json({ success: false, message: err.message });
    }
};

// Delete an event (Organizer for own events, Admin for any)
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        const isAdmin = req.user.role === 'System Admin';
        const isOwner = event.organizer.toString() === req.user.userId;
        if (!isAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
        }

        await event.deleteOne();
        return res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Update event status (Admin only).
 * Body: { status: 'approved' | 'declined' | 'pending' }
 * Also reachable as path-derived helpers /:id/approve and /:id/decline for backwards compat.
 */
exports.updateEventStatus = async (req, res) => {
    try {
        let { status } = req.body || {};
        if (!status) {
            if (req.path.endsWith('/approve')) status = 'approved';
            else if (req.path.endsWith('/decline')) status = 'declined';
        }

        if (!['approved', 'declined', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'status must be approved, declined, or pending.' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        event.status = status;
        await event.save();
        return res.status(200).json({ success: true, message: `Event ${status}`, event });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};
