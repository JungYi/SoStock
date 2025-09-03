const mongoose = require('mongoose');
const Receipt = require('../models/Receipt');
const Inventory = require('../models/Inventory');
const { createReceiptForOrder } = require('../services/receiptService');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/** [GET] /api/receipt - List receipts (latest first) */
const getReceipts = async (_req, res) => {
  try {
    const list = await Receipt.find({}).sort({ receivedAt: -1, createdAt: -1 });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch receipts.' });
  }
};

/** [GET] /api/receipt/:id - Receipt detail */
const getReceiptById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid receipt id.' });
    const doc = await Receipt.findById(id);
    if (!doc) return res.status(404).json({ error: 'Receipt not found.' });
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch receipt.' });
  }
};

/** [POST] /api/receipt - Create receipt
 * If orderId is provided → delegate to service (atomic: receipt + inventory + order)
 * Else → standalone receipt + inventory increment
 */
const createReceipt = async (req, res) => {
  try {
    const { orderId, items, receivedAt, notes } = req.body;

    // If linked to an order → use core service (do NOT duplicate work here)
    if (orderId && isValidId(orderId)) {
      try {
        const saved = await createReceiptForOrder(
          { orderId, items, notes, receivedAt },
          true,
        );
        return res.status(201).json(saved);
      } catch (e) {
        return res.status(400).json({ error: e.message || 'Failed to create receipt.' });
      }
    }

    // Standalone receipt path (no orderId)
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required.' });
    }
    for (const it of items) {
      if (!it.itemId || !isValidId(it.itemId) || !it.name || !it.quantity || it.quantity < 1) {
        return res.status(400).json({ error: 'Invalid item in receipt.' });
      }
    }

    const receipt = new Receipt({
      items: items.map((it) => ({
        itemId: it.itemId,
        name: it.name.trim(),
        quantity: Number(it.quantity),
        unit: it.unit || 'pcs',
        unitPrice: Number(it.unitPrice || 0),
      })),
      receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
      notes: notes?.trim() || '',
    });

    const saved = await receipt.save();

    // Increase inventory quantities
    for (const it of saved.items) {
      await Inventory.findByIdAndUpdate(
        it.itemId,
        { $inc: { quantity: it.quantity } },
        { new: false, runValidators: true },
      );
    }

    return res.status(201).json(saved);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create receipt.' });
  }
};

/** [DELETE] /api/receipt/:id - delete receipt and revert inventory (simple) */
const deleteReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid receipt id.' });

    const doc = await Receipt.findById(id);
    if (!doc) return res.status(404).json({ error: 'Receipt not found.' });

    for (const it of doc.items) {
      await Inventory.findByIdAndUpdate(
        it.itemId,
        { $inc: { quantity: -Math.abs(it.quantity) } },
        { new: false, runValidators: true },
      );
    }

    await doc.deleteOne();
    return res.json({ message: 'Receipt deleted and inventory reverted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete receipt.' });
  }
};

module.exports = {
  getReceipts,
  getReceiptById,
  createReceipt,
  deleteReceipt,
};