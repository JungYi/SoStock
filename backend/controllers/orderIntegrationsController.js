const mongoose = require('mongoose');
const Order = require('../models/Order');
const { computeRemaining, createReceiptForOrder } = require('../services/receiptService');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/** [GET] /api/order/:id/remaining - Remaining table for an order */
const getOrderRemaining = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid order id.' });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const rows = computeRemaining(order);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute remaining.' });
  }
};

/** [POST] /api/order/:id/receipt - Create receipt for remaining or provided items */
const createReceiptFromOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid order id.' });

    const { items, notes, receivedAt } = req.body || {};
    const saved = await createReceiptForOrder({ orderId: id, items, notes, receivedAt }, true);
    return res.status(201).json(saved);
  } catch (err) {
    if (err.code === 'NO_REMAINING') {
      return res.status(409).json({ error: 'Nothing remaining to receive.' });
    }
    return res.status(400).json({ error: err.message || 'Failed to create receipt from order.' });
  }
};

module.exports = { getOrderRemaining, createReceiptFromOrder };