const express = require('express');
const { getProfile, updateProfile, getAllUsers } = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const router = express.Router();

// Protected routes
router.get('/me', authenticateToken, getProfile);
router.patch('/me', authenticateToken, updateProfile);

// Admin only routes
router.get('/', authenticateToken, requireRole('admin'), getAllUsers);

module.exports = router;
