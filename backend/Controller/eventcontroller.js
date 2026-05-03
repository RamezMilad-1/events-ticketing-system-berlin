const Event = require('../Model/EventSchema');
const { validateCustomFields } = require('../utils/categoryFields');

// Create a new event (Organizer only)
exports.createEvent = async (req, res) => {
    try {
        const { category, custom_fields, ticketTypes } = req.body;

        // Validate custom fields if provided
        if (custom_fields) {
            const validationErrors = validateCustomFields(category, custom_fields);
            if (validationErrors.length > 0) {
                return res.status(400).json({ message: 'Validation errors', errors: validationErrors });
            }
        }

        // Process ticket types
        let processedTicketTypes = [];
        if (ticketTypes && Array.isArray(ticketTypes) && ticketTypes.length > 0) {
            processedTicketTypes = ticketTypes.map(ticketType => ({
                type: ticketType.type,
                price: Number(ticketType.price),
                quantity: Number(ticketType.quantity),
                remaining: Number(ticketType.quantity)
            }));
        } else if (custom_fields && custom_fields.ticket_types && Array.isArray(custom_fields.ticket_types)) {
            // Fallback to custom_fields ticket_types for backward compatibility
            processedTicketTypes = custom_fields.ticket_types.map(ticketType => ({
                type: ticketType.type || ticketType,
                price: Number(ticketType.price || 50),
                quantity: Number(ticketType.quantity || 1000),
                remaining: Number(ticketType.quantity || 1000)
            }));
        } else {
            // Default ticket type if none provided
            processedTicketTypes = [{
                type: 'general',
                price: 50,
                quantity: 1000,
                remaining: 1000
            }];
        }

        // For theater events, adjust ticket quantities based on seating layout
        if (category === 'theater' && custom_fields) {
            const totalSeats = (custom_fields.seating_rows || 10) * (custom_fields.seating_columns || 20);
            
            if (processedTicketTypes.length === 1 && processedTicketTypes[0].type === 'general') {
                // If only default ticket type, set quantity to total seats
                processedTicketTypes[0].quantity = totalSeats;
                processedTicketTypes[0].remaining = totalSeats;
            } else {
                // For multiple ticket types, ensure total doesn't exceed available seats
                const totalTicketQuantity = processedTicketTypes.reduce((sum, ticket) => sum + ticket.quantity, 0);
                if (totalTicketQuantity > totalSeats) {
                    // Scale down quantities proportionally
                    const scaleFactor = totalSeats / totalTicketQuantity;
                    processedTicketTypes = processedTicketTypes.map(ticket => ({
                        ...ticket,
                        quantity: Math.floor(ticket.quantity * scaleFactor),
                        remaining: Math.floor(ticket.quantity * scaleFactor)
                    }));
                }
            }
        }

        const eventData = {
            ...req.body,
            ticketTypes: processedTicketTypes,
            organizer: req.user.userId,
            status: 'pending'
        };

        const event = new Event(eventData);
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get all events (Admin only)
exports.getAllEventsAdmin = async (req, res) => {
    try {
        const events = await Event.find().populate('organizer', 'name');
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all approved events (Public)
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({ status: 'approved' }).populate('organizer', 'name');
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get single event by ID (Public for approved events, Admin for all)
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'name');
        if (!event) return res.status(404).json({ message: 'Event not found' });
        
        // Only allow viewing if event is approved or user is admin
        if (event.status !== 'approved' && (!req.user || req.user.role !== 'System Admin')) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update an event (Organizer or Admin)
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Check if user is authorized to update
        if (req.user.role !== 'System Admin' && event.organizer.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Validate custom fields if provided
        if (req.body.custom_fields) {
            const validationErrors = validateCustomFields(req.body.category || event.category, req.body.custom_fields);
            if (validationErrors.length > 0) {
                return res.status(400).json({ message: 'Validation errors', errors: validationErrors });
            }
        }

        // Process ticket types if provided
        if (req.body.ticketTypes && Array.isArray(req.body.ticketTypes)) {
            req.body.ticketTypes = req.body.ticketTypes.map(ticketType => ({
                type: ticketType.type,
                price: Number(ticketType.price),
                quantity: Number(ticketType.quantity),
                remaining: ticketType.remaining !== undefined ? Number(ticketType.remaining) : Number(ticketType.quantity)
            }));

            // For theater events, adjust ticket quantities based on seating layout
            const category = req.body.category || event.category;
            const custom_fields = req.body.custom_fields || event.custom_fields;
            if (category === 'theater' && custom_fields) {
                const totalSeats = (custom_fields.seating_rows || event.custom_fields?.seating_rows || 10) * 
                                 (custom_fields.seating_columns || event.custom_fields?.seating_columns || 20);
                
                // Adjust quantities to match total seating capacity
                const totalTicketQuantity = req.body.ticketTypes.reduce((sum, ticket) => sum + ticket.quantity, 0);
                if (totalTicketQuantity !== totalSeats) {
                    // Scale quantities proportionally or set to total seats for single ticket type
                    if (req.body.ticketTypes.length === 1) {
                        req.body.ticketTypes[0].quantity = totalSeats;
                        req.body.ticketTypes[0].remaining = totalSeats;
                    } else {
                        const scaleFactor = totalSeats / totalTicketQuantity;
                        req.body.ticketTypes = req.body.ticketTypes.map(ticket => ({
                            ...ticket,
                            quantity: Math.floor(ticket.quantity * scaleFactor),
                            remaining: Math.floor(ticket.remaining * scaleFactor)
                        }));
                    }
                }
            }
        }

        const updatableFields = ['title', 'description', 'date', 'location', 'category', 'ticketPrice', 'totalTickets', 'image', 'custom_fields', 'ticketTypes'];
        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) event[field] = req.body[field];
        });

        // If organizer updates, set status back to pending
        if (req.user.role !== 'System Admin') {
            event.status = 'pending';
        }

        await event.save();
        res.json(event);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete an event (Organizer or Admin)
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Check if user is authorized to delete
        if (req.user.role !== 'System Admin' && event.organizer.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await event.deleteOne();
        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update event status (Admin only)
exports.updateEventStatus = async (req, res) => {
    try {
        if (req.user.role !== 'System Admin') {
            return res.status(403).json({ message: 'Only admins can update event status' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Determine status based on the endpoint
        const status = req.path.endsWith('/approve') ? 'approved' : 'declined';

        event.status = status;
        await event.save();

        res.json({ message: `Event ${status}`, event });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Organizer: Get their own events
exports.getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user.userId });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Organizer: Analytics
exports.getMyEventAnalytics = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user.userId });

        const analytics = events.map(event => ({
            title: event.title,
            percentageBooked: ((event.totalTickets - event.remainingTickets) / event.totalTickets * 100).toFixed(2)
        }));

        res.json(analytics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};