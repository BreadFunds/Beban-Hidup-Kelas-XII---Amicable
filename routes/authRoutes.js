import express from 'express';
import { 
  userForm, 
  storeUser, 
  registerForm, 
  storeNewUser, 
  logout 
} from '../controllers/authController.js';

import { requireAuth, requireAdmin } from '../middleware/authmiddleware.js';
import { getAdminPage, getDashboard } from '../controllers/assignmentController.js';

const router = express.Router();

// Root route - redirect intelligently based on session if logged in
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/dashboard');
  }
  res.redirect('/login');
});

// Auth Routes
router.get('/login', userForm);
router.post('/login', storeUser);

router.get('/register', registerForm);
router.post('/register', storeNewUser);

// Protected Page Routes
router.get('/dashboard', requireAuth, getDashboard);
router.get('/admin', requireAuth, requireAdmin, getAdminPage);

// Logout
router.get('/logout', logout);

export default router;