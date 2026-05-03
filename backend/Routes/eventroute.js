const express = require('express');
const router = express.Router();

const eventController = require('../Controller/eventcontroller');
const authorize = require('../Middleware/authorizationMiddleware');

// --- Public ---
// IMPORTANT: more specific paths must come before /:id
router.get('/all', authorize(['System Admin']), eventController.getAllEventsAdmin);

router.get('/', eventController.getAllEvents); // approved events only
router.get('/:id', eventController.getEventById);

// --- Organizer ---
router.post('/', authorize(['Organizer']), eventController.createEvent);

// Updates: organizers (own events only) or admin
router.put('/:id', authorize(['Organizer', 'System Admin']), eventController.updateEvent);
router.delete('/:id', authorize(['Organizer', 'System Admin']), eventController.deleteEvent);

// --- Admin: status management ---
// Preferred: PUT /:id/status with { status: 'approved' | 'declined' | 'pending' }
router.put('/:id/status', authorize(['System Admin']), eventController.updateEventStatus);
// Backwards-compatible aliases (frontend already uses these)
router.put('/:id/approve', authorize(['System Admin']), eventController.updateEventStatus);
router.put('/:id/decline', authorize(['System Admin']), eventController.updateEventStatus);

module.exports = router;
