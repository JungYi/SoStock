const mongoose = require('mongoose');

const ReceiptItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'pcs' },
    unitPrice: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const ReceiptSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // optional
    items: {
      type: [ReceiptItemSchema],
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    receivedAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

ReceiptSchema.index({ receivedAt: -1 });

module.exports = mongoose.model('Receipt', ReceiptSchema);