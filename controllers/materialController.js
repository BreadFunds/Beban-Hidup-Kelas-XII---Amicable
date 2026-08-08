import Material from '../models/Material.js';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

// Helper to convert Node.js file buffer into a Base64 Data URI
const bufferToDataURI = (file) => {
  const base64 = file.buffer.toString('base64');
  return `data:${file.mimetype};base64,${base64}`;
};

// GET /materials - Enriches each file in the files array with 'isImage'
export const getMaterials = async (req, res) => {
  try {
    const rawMaterials = await Material.find().sort({ createdAt: -1 }).lean();

    const materials = rawMaterials.map((item) => {
      const enrichedFiles = (item.files || []).map((file) => {
        const ext = file.originalName ? file.originalName.split('.').pop().toLowerCase() : '';
        return {
          ...file,
          isImage: IMAGE_EXTENSIONS.includes(ext)
        };
      });

      return {
        ...item,
        files: enrichedFiles
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

// POST /materials - Groups all uploaded files into ONE database document
export const postMaterial = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.redirect('/materials?error=Please select at least one file to upload.');
    }

    const { title, subject, description } = req.body;

    // Map all uploaded files into an array of file objects
    const filesArray = req.files.map((file) => ({
      filePath: bufferToDataURI(file),
      originalName: file.originalname
    }));

    // Save ONE document containing the full array of files
    await Material.create({
      title,
      subject,
      description,
      files: filesArray,
      uploadedBy: req.user ? req.user._id : null
    });

    res.redirect('/materials');
  } catch (err) {
    console.error('Error uploading materials:', err);
    res.redirect('/materials?error=Error uploading materials.');
  }
};

// POST /materials/edit/:id - Updates title/description and optionally replaces files
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, description } = req.body;

    const updateData = { title, subject, description };

    if (req.file) {
      updateData.files = [{
        filePath: bufferToDataURI(req.file),
        originalName: req.file.originalname
      }];
    }

    await Material.findByIdAndUpdate(id, updateData);
    res.redirect('/materials');
  } catch (err) {
    console.error('Error updating material:', err);
    res.redirect('/materials?error=Failed to update material.');
  }
};

// POST /materials/delete/:id - Deletes the material document and all its grouped files
export const deleteMaterial = async (req, res) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    res.redirect('/materials');
  } catch (err) {
    console.error('Error deleting material:', err);
    res.redirect('/materials?error=Failed to delete material.');
  }
};