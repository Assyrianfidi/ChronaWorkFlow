import { Router } from 'express';
import { 
  invoiceController,
  validateCreateInvoice,
  validateUpdateInvoice,
  validateAddPayment,
  validateListInvoices
} from '../../controllers/invoicing/invoice.controller';
import { auth, authorizeRoles } from '../../middleware/auth';
import { ROLES } from '../../constants/roles';

const router = Router();

// Apply authentication to all routes
router.use(auth);

// POST /api/invoices - Create invoice (ADMIN, ACCOUNTANT only)
router.post('/', 
  authorizeRoles([ROLES.ADMIN, ROLES.ACCOUNTANT]),
  validateCreateInvoice,
  invoiceController.createInvoice
);

// GET /api/invoices - List invoices (with filters)
router.get('/', 
  validateListInvoices,
  invoiceController.listInvoices
);

// GET /api/invoices/:id - Get invoice by ID
router.get('/:id', 
  invoiceController.getInvoice
);

// PUT /api/invoices/:id - Update invoice (ADMIN, ACCOUNTANT only)
router.put('/:id', 
  authorizeRoles([ROLES.ADMIN, ROLES.ACCOUNTANT]),
  validateUpdateInvoice,
  invoiceController.updateInvoice
);

// DELETE /api/invoices/:id - Void invoice (ADMIN only)
router.delete('/:id', 
  authorizeRoles([ROLES.ADMIN]),
  invoiceController.deleteInvoice
);

// POST /api/invoices/:id/send - Send invoice (ADMIN, ACCOUNTANT only)
router.post('/:id/send', 
  authorizeRoles([ROLES.ADMIN, ROLES.ACCOUNTANT]),
  invoiceController.sendInvoice
);

// GET /api/invoices/:id/pdf - Download PDF
router.get('/:id/pdf', 
  invoiceController.generatePDF
);

// POST /api/invoices/:id/pdf - Generate PDF (same as GET)
router.post('/:id/pdf', 
  invoiceController.generatePDF
);

// POST /api/invoices/:id/payments - Add payment (ADMIN, ACCOUNTANT only)
router.post('/:id/payments', 
  authorizeRoles([ROLES.ADMIN, ROLES.ACCOUNTANT]),
  validateAddPayment,
  invoiceController.addPayment
);

// GET /api/invoices/:id/payments - Get payments for invoice
router.get('/:id/payments', 
  invoiceController.getPayments
);

// GET /api/invoices/:id/summary - Get payment summary
router.get('/:id/summary', 
  invoiceController.getPaymentSummary
);

export default router;
