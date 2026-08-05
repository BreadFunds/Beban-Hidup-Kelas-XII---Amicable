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

// GET /materials
router.get('/', requireAuth, getMaterials);

// POST /materials - Use upload.array() and specify the field name and max count
router.post('/', requireAuth, requireAdmin, upload.array('materialFiles', 10), postMaterial);

// POST /materials/edit/:id - Edit usually replaces a single file, so keep this as upload.single()
router.post('/edit/:id', requireAuth, requireAdmin, upload.single('materialFile'), updateMaterial);

// POST /materials/delete/:id
router.post('/delete/:id', requireAuth, requireAdmin, deleteMaterial);

export default router;