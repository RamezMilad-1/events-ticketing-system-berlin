const express = require('express');
const router = express.Router();

const contactController = require('../Controller/contactController');
const authenticationMiddleware = require('../Middleware/authenticationMiddleware');
const authorize = require('../Middleware/authorizationMiddleware');

// Public submission
router.post('/', contactController.submitMessage);

// Admin: inbox + manage
router.get('/', authenticationMiddleware, authorize(['System Admin']), contactController.listMessages);
router.patch('/:id', authenticationMiddleware, authorize(['System Admin']), contactController.updateMessageStatus);
router.delete('/:id', authenticationMiddleware, authorize(['System Admin']), contactController.deleteMessage);

module.exports = router;
