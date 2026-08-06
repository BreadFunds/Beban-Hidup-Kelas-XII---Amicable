import Material from '../models/Material.js';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

// Helper to convert Node.js file buffer into a Base64 Data URI
const bufferToDataURI = (file) => {
  const base64 = file.buffer.toString('base64');
  return `data:${file.mimetype};base64,${base64}`;
};

// GET /materials
export const getMaterials = async (req, res) => {
  try {
    const rawMaterials = await Material.find().sort({ createdAt: -1 }).lean();

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

// POST /materials
export const postMaterial = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.redirect('/materials?error=Please select at least one file to upload.');
    }

    const { title, subject, description } = req.body;

    const materialsToCreate = req.files.map((file, index) => ({
      title: req.files.length > 1 ? `${title} (${index + 1})` : title,
      subject,
      description,
      filePath: bufferToDataURI(file), // Stored directly as Base64 string in MongoDB
      originalName: file.originalname
    }));

    await Material.insertMany(materialsToCreate);
    res.redirect('/materials');
  } catch (err) {
    console.error('Error uploading materials:', err);
    res.redirect('/materials?error=Error uploading materials.');
  }
};

// POST /materials/edit/:id
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, description } = req.body;

    const updateData = { title, subject, description };

    if (req.file) {
      updateData.filePath = bufferToDataURI(req.file);
      updateData.originalName = req.file.originalname;
    }

    await Material.findByIdAndUpdate(id, updateData);
    res.redirect('/materials');
  } catch (err) {
    console.error('Error updating material:', err);
    res.redirect('/materials?error=Failed to update material.');
  }
};

// POST /materials/delete/:id
export const deleteMaterial = async (req, res) => {
  try {
    // Standard MongoDB deletion (No local file cleanup needed)
    await Material.findByIdAndDelete(req.params.id);
    res.redirect('/materials');
  } catch (err) {
    console.error('Error deleting material:', err);
    res.redirect('/materials?error=Failed to delete material.');
  }
};