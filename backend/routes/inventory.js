const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// [GET] Fetch all inventory items
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find().sort({ updatedAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory items.' });
  }
});

// [POST] Create a new inventory item
router.post('/', async (req, res) => {
  try {
    const { name, category, quantity, unit } = req.body;
    const newItem = new Inventory({ name, category, quantity, unit });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ error: 'Invalid inventory data.' });
  }
});

// [PUT] Update an inventory item
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ error: 'Item not found.' });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update item.' });
  }
});

// [DELETE] Delete an inventory item
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: 'Item not found.' });
    res.json({ message: 'Item deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item.' });
  }
});

module.exports = router;