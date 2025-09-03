const express = require('express');
const router = express.Router();
const core = require('../controllers/orderController');
const integ = require('../controllers/orderIntegrationsController');

router.post('/', core.createOrder);
router.get('/', core.getOrders);
router.get('/:id', core.getOrderById);
router.put('/:id', core.updateOrder);
router.patch('/:id/status', core.updateOrderStatus);
router.delete('/:id', core.deleteOrder);

// integrations
router.get('/:id/remaining', integ.getOrderRemaining);
router.post('/:id/receipt', integ.createReceiptFromOrder);

module.exports = router;