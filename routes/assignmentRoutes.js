// routes/assignmentRoutes.js
import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/authmiddleware.js';
import { 
  getDashboard, 
  getAdminPage, 
  createAssignment, 
  updateAssignment, 
  deleteAssignment, 
  toggleAssignment 
} from '../controllers/assignmentController.js';

const router = express.Router();

// Student & Admin accessible route
router.get('/dashboard', requireAuth, getDashboard);
router.post('/assignments/toggle/:id', requireAuth, toggleAssignment);

// --- ADMIN ONLY ROUTES ---
router.get('/admin', requireAuth, requireAdmin, getAdminPage);
router.post('/assignments', requireAuth, requireAdmin, createAssignment);
router.post('/assignments/update/:id', requireAuth, requireAdmin, updateAssignment);
router.post('/assignments/delete/:id', requireAuth, requireAdmin, deleteAssignment);

import { triggerRemindersCron } from '../controllers/assignmentController.js';

// Vercel cron job endpoint (unprotected or secured with a cron secret)
router.get('/api/cron/reminders', triggerRemindersCron);

export default router;