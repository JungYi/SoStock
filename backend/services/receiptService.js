const mongoose = require('mongoose');
const Order = require('../models/Order');
const Receipt = require('../models/Receipt');
const Inventory = require('../models/Inventory');

/* ----------------------- helpers ----------------------- */

// safe number cast with default
const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// rounding to avoid fp drift
const roundTo = (v, dp = 3) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  const m = 10 ** dp;
  return Math.round(n * m) / m;
};

// Map or plain object → get by key
const mget = (m, key) => {
  if (!m) return undefined;
  return m instanceof Map ? m.get(key) : m[key];
};

// Map or plain object → set numeric value by key
const mset = (m, key, val) => {
  const n = toNum(val, 0);
  if (m instanceof Map) {
    m.set(key, n);
  } else {
    // eslint-disable-next-line no-param-reassign
    m[key] = n;
  }
};

// unit helpers
const integerUnits = ['pcs', 'ea', 'bag', 'pack'];
const isIntegerUnit = (u) => integerUnits.includes(String(u || '').toLowerCase());

/* ----------------------- core calc ----------------------- */

const computeRemaining = (order) => {
  const received = order.receivedMap || {};
  return order.items.map((it) => {
    const key = String(it.itemId);
    const ordered = toNum(it.quantity, 0);
    const got = toNum(mget(received, key), 0);
    // ✅ round remaining to 3 dp to avoid fp crumbs
    const remaining = Math.max(roundTo(ordered - got, 3), 0);
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

/* ----------------- transactional creation ---------------- */

const createReceiptForOrder = async ({ orderId, items, notes, receivedAt }, useTxn = true) => {
  const session = useTxn ? await mongoose.startSession() : null;

  try {
    if (session) session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) throw new Error('Order not found');

    const remainingRows = computeRemaining(order);
    const byId = new Map(remainingRows.map((r) => [String(r.itemId), r]));

    // If no items given → take all remaining rows (remaining > 0)
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

    // Build receipt items with validation (integer units must be integers)
    const receiptItems = targets.map((t) => {
      const key = String(t.itemId);
      const row = byId.get(key);
      if (!row) throw new Error('Item not in order');

      // quantity normalization
      const rawQty = t.quantity ?? row.remaining;
      const qtyNum = toNum(rawQty, NaN);
      if (!Number.isFinite(qtyNum) || qtyNum <= 0) throw new Error('Invalid quantity');
      if (qtyNum > row.remaining) throw new Error('Quantity exceeds remaining');

      // unit & integer enforcement
      const unit = (row.unit || 'pcs').toLowerCase();
      if (isIntegerUnit(unit) && !Number.isInteger(qtyNum)) {
        const e = new Error(`Quantity must be an integer for unit "${unit}".`);
        e.code = 'INVALID_INTEGER_QTY';
        throw e;
      }

      // apply rounding only for non-integer units
      const finalQty = isIntegerUnit(unit) ? qtyNum : roundTo(qtyNum, 3);
      const rawPrice = t.unitPrice ?? row.unitPrice ?? 0;
      const finalPrice = roundTo(toNum(rawPrice, 0), 3);

      return {
        itemId: row.itemId,
        name: row.name,               // snapshot from order
        quantity: finalQty,           // ✅ normalized
        unit,
        unitPrice: finalPrice,        // ✅ normalized
      };
    });

    // 1) create receipt document
    const receiptArr = await Receipt.create([{
      orderId: order._id,
      items: receiptItems,
      receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
      notes: notes || '[system] auto-generated from order UI',
    }], { session });
    const saved = receiptArr[0];

    // 2) increment inventory quantities
    for (const it of receiptItems) {
      await Inventory.findByIdAndUpdate(
        it.itemId,
        { $inc: { quantity: it.quantity } },
        { session, runValidators: true },
      );
    }

    // 3) update order.receivedMap (✅ rounding applied here)
    const recMap = order.receivedMap || {};
    for (const it of receiptItems) {
      const key = String(it.itemId);
      const prev = toNum(mget(recMap, key), 0);
      // ⬇️ 이 줄이 네가 헷갈린 포인트: 누적값에 roundTo 적용
      const next = roundTo(prev + toNum(it.quantity, 0), 3);
      mset(recMap, key, next);
    }
    order.receivedMap = recMap;

    // 4) update order.status by remaining sum
    const after = computeRemaining(order);
    const totalOrdered = after.reduce((a, b) => a + toNum(b.ordered, 0), 0);
    const totalRemaining = after.reduce((a, b) => a + toNum(b.remaining, 0), 0);

    if (totalRemaining === 0) order.status = 'received';
    else if (totalRemaining === totalOrdered) order.status = 'pending';
    else order.status = 'partial';

    // 5) append system note
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