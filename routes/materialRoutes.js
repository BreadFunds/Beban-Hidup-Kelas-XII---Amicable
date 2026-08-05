import express from 'express';
import { 
  getMaterials, 
  postMaterial, 
  updateMaterial, 
  deleteMaterial 
} from '../controllers/materialController.js';
import { requireAuth, requireAdmin } from '../middleware/authmiddleware.js';
import { upload } from '../middleware/uploadmiddleware.js';

const router = express.Router();

// GET /materials - View all materials (authenticated users)
router.get('/', requireAuth, getMaterials);

// POST /materials - Upload new material (admin only)
router.post('/', requireAuth, requireAdmin, upload.single('materialFile'), postMaterial);

// POST /materials/edit/:id - Edit existing material (admin only)
router.post('/edit/:id', requireAuth, requireAdmin, upload.single('materialFile'), updateMaterial);

// POST /materials/delete/:id - Delete material (admin only)
router.post('/delete/:id', requireAuth, requireAdmin, deleteMaterial);

export default router;