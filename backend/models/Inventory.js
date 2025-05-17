const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: 'Uncategorized' },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'pcs' },
  },
  {
    timestamps: true, // createdAt, updatedAt Auto generate
  }
);

module.exports = mongoose.model('Inventory', InventorySchema);
