import multer from 'multer';

// Built-in memory storage (No npm packages required)
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit per file
});