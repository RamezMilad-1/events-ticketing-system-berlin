const express = require('express');
const router = express.Router();
const bookingController = require("../Controller/bookingController");
const authorizationMiddleware = require('../Middleware/authorizationMiddleware');


// POST /api/v1/bookings - Book an event
router.post("/", bookingController.bookAnEvent);

// GET /api/v1/bookings/event/:eventId - Get bookings for an event (public for seat availability)
router.get("/event/:eventId", bookingController.getBookingsForEvent);

// GET /api/v1/bookings/:id - Get a booking by ID for the authenticated user
router.get("/:id", bookingController.getBookingById);

// DELETE /api/v1/bookings/:id - Cancel a booking for the authenticated user
router.delete("/:id", bookingController.cancelBooking);

module.exports = router;