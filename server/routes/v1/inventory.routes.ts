import { Router } from 'express';
import { authenticate, authorize, csrfProtection, authLimiter } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryHistory,
} from '../../controllers/inventory.controller';
import { inventoryQuerySchema } from '../../types/inventory.types';

const router = Router();

// Apply rate limiting to all inventory routes
router.use(authLimiter);

// Apply CSRF protection to all state-changing requests
router.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});

// Apply authentication to all routes
router.use(authenticate);

// Public routes (no authorization required)
router.get('/', validate({ query: inventoryQuerySchema }), getInventory);
router.get('/:id', getInventoryItem);
router.get('/:id/history', getInventoryHistory);

// Protected routes (require specific roles)
router.post('/', 
  authorize(['ADMIN', 'INVENTORY_MANAGER']), 
  csrfProtection, 
  validate({ body: createInventorySchema }), 
  createInventoryItem
);

router.put('/:id', 
  authorize(['ADMIN', 'INVENTORY_MANAGER']), 
  csrfProtection, 
  validate({ body: updateInventorySchema }), 
  updateInventoryItem
);

delete('/:id', 
  authorize(['ADMIN', 'INVENTORY_MANAGER']), 
  csrfProtection, 
  deleteInventoryItem
);

export default router;
