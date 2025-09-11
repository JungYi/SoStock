const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: '', trim: true, index: true },
    category: { type: String, default: 'Uncategorized', maxlength: 50 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'pcs', trim: true, maxlength: 50 }
  },
  {
    timestamps: true, // createdAt, updatedAt Auto generate
  }
);

InventorySchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Inventory', InventorySchema);