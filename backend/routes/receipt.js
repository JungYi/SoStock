const express = require('express');
const router = express.Router();

// [GET] /api/receipt
router.get('/', (req, res) => {
  res.json({ message: 'Receipt list (placeholder)' });
});

// [POST] /api/receipt
router.post('/', (req, res) => {
  res.json({ message: 'Create receipt (placeholder)' });
});

module.exports = router;