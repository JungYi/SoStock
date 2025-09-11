const { z } = require('zod');

const inventoryCreate = z.object({
  name: z.string().trim().min(1, 'name is required.'),
  brand: z.string().trim().optional().default(''),
  category: z.string().trim().max(50, 'category max length is 50').optional(),
  quantity: z.number().min(0, 'quantity must be an integer ≥ 0.'),
  unit: z.string().trim().min(1, 'unit is required.').max(50), 
});

const inventoryUpdate = inventoryCreate.partial();

module.exports = { inventoryCreate, inventoryUpdate };