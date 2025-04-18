const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Cấu hình Multer để lưu file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Lọc file được upload
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload an image or PDF.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Route xử lý OCR (authenticated)
router.post('/ocr', authMiddleware, upload.single('file'), documentController.processOCR);

// Route xử lý OCR (public - không cần xác thực)
router.post('/public/ocr', upload.single('file'), (req, res) => {
  // Add user info to request to maintain compatibility with processOCR
  req.user = { id: 'public-user' };
  documentController.processOCR(req, res);
});

// Route lấy danh sách tài liệu của người dùng
router.get('/documents', authMiddleware, documentController.getUserDocuments);

// Route lấy chi tiết tài liệu
router.get('/documents/:id', authMiddleware, documentController.getDocumentById);

// Route xóa tài liệu
router.delete('/documents/:id', authMiddleware, documentController.deleteDocument);

module.exports = router; 