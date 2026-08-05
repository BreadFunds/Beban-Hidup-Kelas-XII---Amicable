import fs from 'fs';
import path from 'path';
import Material from '../models/Material.js';

// Helper array for image extensions
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

// GET /materials - Render the materials page with full context
export const getMaterials = async (req, res) => {
  try {
    const rawMaterials = await Material.find().sort({ createdAt: -1 }).lean();

    // Map through materials to add the 'isImage' boolean dynamically
    const materials = rawMaterials.map((item) => {
      const ext = item.originalName ? item.originalName.split('.').pop().toLowerCase() : '';
      return {
        ...item,
        isImage: IMAGE_EXTENSIONS.includes(ext)
      };
    });

    res.render('materials', {
      user: req.user,
      isAdmin: req.user && req.user.role === 'admin',
      materials,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('Error fetching materials:', err);
    res.status(500).render('materials', {
      user: req.user,
      isAdmin: req.user && req.user.role === 'admin',
      materials: [],
      error: 'Error fetching materials.'
    });
  }
};

// POST /materials - Save multiple uploaded materials
export const postMaterial = async (req, res) => {
  try {
    // Check req.files instead of req.file
    if (!req.files || req.files.length === 0) {
      return res.redirect('/materials?error=Please select at least one file to upload.');
    }

    const { title, subject, description } = req.body;

    // Create an array of material objects to insert
    const materialsToCreate = req.files.map((file, index) => {
      return {
        // If multiple files are uploaded, append a number to the title to distinguish them
        title: req.files.length > 1 ? `${title} (${index + 1})` : title,
        subject,
        description,
        filePath: `/uploads/${file.filename}`,
        originalName: file.originalname
      };
    });

    // Insert all documents at once
    await Material.insertMany(materialsToCreate);

    res.redirect('/materials');
  } catch (err) {
    console.error('Error uploading materials:', err);
    res.redirect('/materials?error=Error uploading materials.');
  }
};

// POST /materials/edit/:id - Update material details (and optionally replace file)
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, description } = req.body;

    const existingMaterial = await Material.findById(id);
    if (!existingMaterial) {
      return res.redirect('/materials?error=Material not found.');
    }

    const updateData = {
      title,
      subject,
      description
    };

    // If a new file was uploaded, update file path and delete old file from disk
    if (req.file) {
      updateData.filePath = `/uploads/${req.file.filename}`;
      updateData.originalName = req.file.originalname;

      // Remove previous physical file if it exists
      if (existingMaterial.filePath) {
        const oldPath = path.join(process.cwd(), 'public', existingMaterial.filePath);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    await Material.findByIdAndUpdate(id, updateData);
    res.redirect('/materials');
  } catch (err) {
    console.error('Error updating material:', err);
    res.redirect('/materials?error=Failed to update material.');
  }
};

// POST /materials/delete/:id - Delete material by ID and clean up disk file
export const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (material && material.filePath) {
      const diskPath = path.join(process.cwd(), 'public', material.filePath);
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    }

    await Material.findByIdAndDelete(req.params.id);
    res.redirect('/materials');
  } catch (err) {
    console.error('Error deleting material:', err);
    res.redirect('/materials?error=Failed to delete material.');
  }
};