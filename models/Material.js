import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filePath: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  }
});

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  files: [fileSchema], // Array storing all uploaded files for this material
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Material = mongoose.model('Material', materialSchema);
export default Material;