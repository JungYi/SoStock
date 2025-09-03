const mongoose = require('mongoose');
const Order = require('../models/Order');
const Receipt = require('../models/Receipt');
const Inventory = require('../models/Inventory');

// ---- helpers ----
const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const mget = (m, key) => {
  if (!m) return undefined;
  return (m instanceof Map) ? m.get(key) : m[key];
};

const mset = (m, key, val) => {
  const n = toNum(val, 0);
  if (m instanceof Map) {
    m.set(key, n);
  } else {
    // eslint-disable-next-line no-param-reassign
    m[key] = n;
  }
};

// ---- core calc ----
const computeRemaining = (order) => {
  const received = order.receivedMap || {};
  return order.items.map((it) => {
    const key = String(it.itemId);
    const ordered = toNum(it.quantity, 0);
    const got = toNum(mget(received, key), 0);
    const remaining = Math.max(ordered - got, 0);
    return {
      itemId: it.itemId,
      name: it.name,
      unit: it.unit || 'pcs',
      unitPrice: toNum(it.unitPrice, 0),
      ordered,
      received: got,
      remaining,
    };
  });
};

// ---- transactional receipt creation ----
const createReceiptForOrder = async ({ orderId, items, notes, receivedAt }, useTxn = true) => {
  const session = useTxn ? await mongoose.startSession() : null;
  try {
    if (session) session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error('Order not found');

    const remainingRows = computeRemaining(order);
    const byId = new Map(remainingRows.map((r) => [String(r.itemId), r]));

    // if no items → take all remaining rows
    const targets = (items && items.length > 0)
      ? items
      : remainingRows
          .filter((r) => r.remaining > 0)
          .map((r) => ({ itemId: r.itemId, quantity: r.remaining }));

    if (targets.length === 0) {
      const err = new Error('Nothing remaining to receive');
      err.code = 'NO_REMAINING';
      throw err;
    }

    const receiptItems = targets.map((t) => {
      const key = String(t.itemId);
      const row = byId.get(key);
      if (!row) throw new Error('Item not in order');

      const qty = toNum((t.quantity ?? row.remaining), NaN);
      if (!Number.isFinite(qty) || qty <= 0) throw new Error('Invalid quantity');
      if (qty > row.remaining) throw new Error('Quantity exceeds remaining');

      return {
        itemId: row.itemId,
        name: row.name, // snapshot from order
        quantity: qty,
        unit: row.unit || 'pcs',
        unitPrice: toNum((t.unitPrice ?? row.unitPrice), 0),
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
    const recMap = order.receivedMap || {};
    for (const it of receiptItems) {
      const key = String(it.itemId);
      const prev = toNum(mget(recMap, key), 0);
      const next = prev + toNum(it.quantity, 0);
      mset(recMap, key, next);
    }
    order.receivedMap = recMap;

    // 4) update status
    const after = computeRemaining(order);
    const totalOrdered = after.reduce((a, b) => a + toNum(b.ordered, 0), 0);
    const totalRemaining = after.reduce((a, b) => a + toNum(b.remaining, 0), 0);

    if (totalRemaining === 0) order.status = 'received';
    else if (totalRemaining === totalOrdered) order.status = 'pending';
    else order.status = 'partial';

    // 5) system note
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