const mongoose = require('mongoose');
const Order = require('../models/Order');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// [POST] /api/order - Create a new order
const createOrder = async (req, res) => {
  try {
    const { supplier, items, expectedDate, notes } = req.body;

    if (!supplier || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Supplier and at least one item are required.' });
    }

    for (const it of items) {
      if (!it.itemId || !isValidId(it.itemId) || !it.name || !it.quantity || it.quantity < 1) {
        return res.status(400).json({ error: 'Invalid item in order.' });
      }
    }

    const order = new Order({ supplier, items, expectedDate, notes });
    const saved = await order.save();
    return res.status(201).json(saved);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create order.' });
  }
};

// [GET] /api/order - Get order list (optional ?status=pending|canceled|received)
const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) {
      const arr = String(status).split(',').map((s) => s.trim());
      filter.status = { $in: arr };
    }
    const list = await Order.find(filter).sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

// [GET] /api/order/:id - Get order detail
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid order id.' });
    }
    const doc = await Order.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch order.' });
  }
};

// [PUT] /api/order/:id - Update basic fields (not status)
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid order id.' });
    }

    // Only allow specific fields here; status must use PATCH /status
    const allowed = ['supplier', 'items', 'expectedDate', 'notes'];
    const payload = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    // Basic items validation if provided
    if (payload.items) {
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        return res.status(400).json({ error: 'Items must be a non-empty array.' });
      }
      for (const it of payload.items) {
        if (!it.itemId || !isValidId(it.itemId) || !it.name || !it.quantity || it.quantity < 1) {
          return res.status(400).json({ error: 'Invalid item in order.' });
        }
      }
    }

    const updated = await Order.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update order.' });
  }
};

// [PATCH] /api/order/:id/status - Update status only
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid order id.' });
    }

    const allowed = ['pending', 'canceled', 'received'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const doc = await Order.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Simple transition rule: once received, do not revert
    if (doc.status === 'received' && status !== 'received') {
      return res.status(400).json({ error: 'Cannot change status after received.' });
    }

    doc.status = status;
    const saved = await doc.save();
    return res.json(saved);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update status.' });
  }
};

// [DELETE] /api/order/:id - Optional for MVP
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid order id.' });
    }
    const deleted = await Order.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    return res.json({ message: 'Order deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete order.' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder
};