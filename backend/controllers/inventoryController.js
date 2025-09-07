const Inventory = require('../models/Inventory');

// [GET] /api/inventory
const getInventoryList = async (_req, res) => {
  try {
    const items = await Inventory.find().sort({ updatedAt: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch inventory items.' });
  }
};

// [POST] /api/inventory
const createInventoryItem = async (req, res) => {
  try {
    const { name, category, brand, quantity, unit } = req.body;
    const newItem = new Inventory({
      name,
      category: category || '',
      brand: brand || '',
      quantity,
      unit: unit || 'pcs',
    });
    const savedItem = await newItem.save();
    return res.status(201).json(savedItem);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid inventory data.' });
  }
};

// [PUT] /api/inventory/:id
const updateInventoryItem = async (req, res) => {
  try {
    const payload = {};
    const allow = ['name', 'category', 'brand', 'quantity', 'unit'];
    allow.forEach((k) => {
      if (k in req.body) payload[k] = req.body[k];
    });

    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ error: 'Item not found.' });
    return res.json(updatedItem);
  } catch (err) {
    return res.status(400).json({ error: 'Failed to update item.' });
  }
};

// [DELETE] /api/inventory/:id
const deleteInventoryItem = async (req, res) => {
  try {
    const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: 'Item not found.' });
    return res.json({ message: 'Item deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete item.' });
  }
};

module.exports = {
  getInventoryList,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
};