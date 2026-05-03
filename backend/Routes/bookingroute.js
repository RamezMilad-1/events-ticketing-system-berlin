const express = require('express');
const router = express.Router();

const bookingController = require('../Controller/bookingController');
const authorize = require('../Middleware/authorizationMiddleware');

// POST /api/v1/bookings — book tickets for an event (Standard User)
router.post('/', authorize(['Standard User']), bookingController.bookAnEvent);

// GET /api/v1/bookings/event/:eventId — used by theater seat picker
router.get('/event/:eventId', bookingController.getBookingsForEvent);

// GET /api/v1/bookings/:id — own booking details (Standard User)
router.get('/:id', authorize(['Standard User']), bookingController.getBookingById);

// DELETE /api/v1/bookings/:id — cancel own booking (Standard User)
router.delete('/:id', authorize(['Standard User']), bookingController.cancelBooking);

module.exports = router;
