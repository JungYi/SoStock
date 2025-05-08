const express = require('express');
const router = express.Router();

// [GET] /api/order
router.get('/', (req, res) => {
  res.json({ message: 'Order list (placeholder)' });
});

// [POST] /api/order
router.post('/', (req, res) => {
  res.json({ message: 'Create order (placeholder)' });
});

module.exports = router;