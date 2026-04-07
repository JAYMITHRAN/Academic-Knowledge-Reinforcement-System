// src/middleware/upload.js
const multer = require('multer');
const path   = require('path');

const storage = multer.memoryStorage(); // keep in memory — parse directly

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    // multer v2: pass a MulterError instance to reject with a proper code
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// Global multer error handler middleware
// Add after upload.single()/upload.fields() in any route that needs it
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10 MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Only .xlsx, .xls, and .csv files are allowed.' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

module.exports = { upload, handleMulterError };