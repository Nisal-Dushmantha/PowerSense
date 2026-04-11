const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAdminSummary,
  getAllUsers,
  getAuditLogs,
  updateUserRole,
  updateUserStatus
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/summary', getAdminSummary);
router.get('/users', getAllUsers);
router.get('/audit-logs', getAuditLogs);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);

module.exports = router;
