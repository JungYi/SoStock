const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'pcs' },
    unitPrice: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    supplier: { type: String, required: true },
    items: { type: [OrderItemSchema], validate: (v) => Array.isArray(v) && v.length > 0 },
    status: { type: String, enum: ['pending', 'partial', 'received', 'canceled'], default: 'pending' },
    expectedDate: { type: Date },
    notes: { type: String, default: '' },
    receivedMap: { type: Map, of: Number, default: {} }, // itemId(string) -> received qty
  },
  { timestamps: true },
);

OrderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);