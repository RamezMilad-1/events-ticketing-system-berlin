const express = require('express');
const router = express.Router();

const outletController = require('../Controller/outletController');
const authorize = require('../Middleware/authorizationMiddleware');

// Public reads
router.get('/', outletController.listOutlets);
router.get('/:id', outletController.getOutletById);

// Admin writes
router.post('/', authorize(['System Admin']), outletController.createOutlet);
router.put('/:id', authorize(['System Admin']), outletController.updateOutlet);
router.delete('/:id', authorize(['System Admin']), outletController.deleteOutlet);

module.exports = router;
