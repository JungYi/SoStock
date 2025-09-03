const mongoose = require('mongoose');
const Order = require('../models/Order');
const Receipt = require('../models/Receipt');
const Inventory = require('../models/Inventory');

const computeRemaining = (order) => {
  const received = order.receivedMap || {};
  return order.items.map((it) => {
    const key = String(it.itemId);
    const ordered = Number(it.quantity);
    const got = Number(received.get ? received.get(key) : received[key] || 0);
    const remaining = Math.max(ordered - got, 0);
    return {
      itemId: it.itemId,
      name: it.name,
      unit: it.unit || 'pcs',
      unitPrice: it.unitPrice || 0,
      ordered,
      received: got,
      remaining,
    };
  });
};

const createReceiptForOrder = async ({ orderId, items, notes, receivedAt }, useTxn = true) => {
  const session = useTxn ? await mongoose.startSession() : null;
  try {
    if (session) session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error('Order not found');

    const remainingRows = computeRemaining(order);
    const byId = new Map(remainingRows.map((r) => [String(r.itemId), r]));

    // if no items provided → take all remaining rows with remaining > 0
    const targets = (items && items.length > 0)
      ? items
      : remainingRows.filter((r) => r.remaining > 0).map((r) => ({ itemId: r.itemId, quantity: r.remaining }));

    if (targets.length === 0) {
      const err = new Error('Nothing remaining to receive');
      err.code = 'NO_REMAINING';
      throw err;
    }

    const receiptItems = targets.map((t) => {
      const key = String(t.itemId);
      const row = byId.get(key);
      if (!row) throw new Error('Item not in order');
      const qty = Number(t.quantity ?? row.remaining);
      if (!Number.isFinite(qty) || qty <= 0) throw new Error('Invalid quantity');
      if (qty > row.remaining) throw new Error('Quantity exceeds remaining');

      return {
        itemId: row.itemId,
        name: row.name, // snapshot from order
        quantity: qty,
        unit: row.unit || 'pcs',
        unitPrice: Number(t.unitPrice ?? row.unitPrice ?? 0),
      };
    });

    // 1) create receipt
    const receiptArr = await Receipt.create([{
      orderId: order._id,
      items: receiptItems,
      receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
      notes: notes || '[system] auto-generated from order UI',
    }], { session });
    const saved = receiptArr[0];

    // 2) increment inventory
    for (const it of receiptItems) {
      await Inventory.findByIdAndUpdate(
        it.itemId,
        { $inc: { quantity: it.quantity } },
        { session, runValidators: true },
      );
    }

    // 3) update order.receivedMap
    const recMap = order.receivedMap || new Map();
    for (const it of receiptItems) {
      const key = String(it.itemId);
      const prev = recMap.get ? recMap.get(key) : recMap[key] || 0;
      const next = Number(prev) + Number(it.quantity);
      if (recMap.set) recMap.set(key, next);
      else recMap[key] = next;
    }
    order.receivedMap = recMap;

    // 4) update status by remaining sum
    const after = computeRemaining(order);
    const totalOrdered = order.items.reduce((a, b) => a + Number(b.quantity || 0), 0);
    const totalRemaining = after.reduce((a, b) => a + Number(b.remaining || 0), 0);

    if (totalRemaining === 0) order.status = 'received';
    else if (totalRemaining === totalOrdered) order.status = 'pending';
    else order.status = 'partial';

    // 5) add system note
    order.notes = order.notes
      ? `${order.notes}\n[system] receipt updated via order integration at ${new Date().toISOString()}`
      : `[system] receipt updated via order integration at ${new Date().toISOString()}`;

    await order.save({ session });

    if (session) await session.commitTransaction();
    return saved;
  } catch (e) {
    if (session) await session.abortTransaction();
    throw e;
  } finally {
    if (session) session.endSession();
  }
};

module.exports = { computeRemaining, createReceiptForOrder };