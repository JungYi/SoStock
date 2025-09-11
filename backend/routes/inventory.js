const express = require('express');
const router = express.Router();
const {
  getInventoryList,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} = require('../controllers/inventoryController');
const { validate } = require('../validation/validate');
const schemas = require('../validation/schemas');
const validateObjectId = require('../middlewares/validateObjectId');

router.get('/', getInventoryList);
router.post('/', validate(schemas.inventoryCreate), createInventoryItem);
router.put('/:id', validateObjectId, validate(schemas.inventoryUpdate), updateInventoryItem);
router.delete('/:id', validateObjectId, deleteInventoryItem);

module.exports = router;