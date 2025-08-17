const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true }, // FK reference to Inventory
    name: { type: String, required: true },        // Snapshot of name at order time
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'pcs' },        // Snapshot of unit at order time
    unitPrice: { type: Number, default: 0, min: 0 } // Optional: for cost tracking
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    supplier: { type: String, required: true },
    items: {
      type: [OrderItemSchema],
      validate: v => Array.isArray(v) && v.length > 0
    },
    status: {
      type: String,
      enum: ['pending', 'canceled', 'received'],
      default: 'pending'
    },
    expectedDate: { type: Date }, // Optional
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

// Useful for dashboards and filtering
OrderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);