const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');

// Order CRUD
router.post('/', createOrder);                 // Create
router.get('/', getOrders);                    // List
router.get('/:id', getOrderById);              // Detail
router.put('/:id', updateOrder);               // Update (non-status)
router.patch('/:id/status', updateOrderStatus);// Status only
router.delete('/:id', deleteOrder);            // Optional

module.exports = router;