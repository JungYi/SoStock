const mongoose = require('mongoose');

const UNITS = ['pcs', 'kg', 'g', 'ml', 'l', 'pack'];

const InventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Uncategorized', maxlength: 50 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'pcs', enum: UNITS }
  },
  {
    timestamps: true, // createdAt, updatedAt Auto generate
  }
);

module.exports = mongoose.model('Inventory', InventorySchema);