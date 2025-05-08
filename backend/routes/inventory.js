const express = require('express');
const router = express.Router();

// [GET] /api/inventory
router.get('/', (req, res) => {
  res.json({ message: 'Inventory list (placeholder)' });
});

// [POST] /api/inventory
router.post('/', (req, res) => {
  res.json({ message: 'Create inventory item (placeholder)' });
});

module.exports = router;
