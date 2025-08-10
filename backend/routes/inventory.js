const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const {
  getInventoryList,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} = require('../controllers/inventoryController');

const UNITS = ['pcs', 'kg', 'g', 'ml', 'l', 'pack'];

// Common handler to send validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  return next();
};

// Create
const validateCreate = [
  body('name').trim().isLength({ min: 1 }).withMessage('name is required.'),
  body('quantity').isInt({ min: 0 }).withMessage('quantity must be an integer ≥ 0.'),
  body('unit').optional().isIn(UNITS).withMessage(`unit must be one of: ${UNITS.join(', ')}`),
  body('category').optional().isLength({ max: 50 }).withMessage('category max length is 50.'),
  handleValidation
];

// Update (partial allowed)
const validateUpdate = [
  param('id').isMongoId().withMessage('invalid id.'),
  body('name').optional().trim().isLength({ min: 1 }).withMessage('name cannot be empty.'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('quantity must be an integer ≥ 0.'),
  body('unit').optional().isIn(UNITS).withMessage(`unit must be one of: ${UNITS.join(', ')}`),
  body('category').optional().isLength({ max: 50 }).withMessage('category max length is 50.'),
  handleValidation
];

// Delete
const validateDelete = [
  param('id').isMongoId().withMessage('invalid id.'),
  handleValidation
];

router.get('/', getInventoryList);
router.post('/', validateCreate, createInventoryItem);
router.put('/:id', validateUpdate, updateInventoryItem);
router.delete('/:id', validateDelete, deleteInventoryItem);

module.exports = router;