const express = require('express');
const {
  adminLogin,
  getUsers,
  updateUser,
  deleteUser,
  getAllDocuments,
  getSchema
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Admin login
router.post('/login', adminLogin);

// Protected admin routes
router.get('/users', protect, admin, getUsers);
router.put('/users/:id', protect, admin, updateUser);
router.delete('/users/:id', protect, admin, deleteUser);
router.get('/documents', protect, admin, getAllDocuments);
router.get('/schema', protect, admin, getSchema);

module.exports = router; 