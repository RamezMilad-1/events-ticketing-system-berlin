const express = require('express');
const router = express.Router();

const userController = require('../Controller/userController');
const authorize = require('../Middleware/authorizationMiddleware');

const ALL_ROLES = ['Standard User', 'Organizer', 'System Admin'];

// --- Authenticated user (any role) ---
router.put('/changePassword', authorize(ALL_ROLES), userController.changePassword);

router.get('/profile', authorize(ALL_ROLES), userController.getUserProfile);
router.put('/profile', authorize(ALL_ROLES), userController.updateUserProfile);
router.delete('/profile', authorize(ALL_ROLES), userController.deleteOwnProfile);

// --- Standard user ---
router.get('/bookings', authorize(['Standard User']), userController.getCurrentBookings);

// --- Organizer ---
router.get('/events', authorize(['Organizer']), userController.getMyEvents);
router.get('/events/analytics', authorize(['Organizer']), userController.getMyEventAnalytics);

// --- Admin ---
router.get('/', authorize(['System Admin']), userController.getAllUsers);
router.get('/:id', authorize(['System Admin']), userController.getSingleUser);
router.put('/:id', authorize(['System Admin']), userController.updateUserRole);
router.delete('/:id', authorize(['System Admin']), userController.deleteUser);

module.exports = router;
