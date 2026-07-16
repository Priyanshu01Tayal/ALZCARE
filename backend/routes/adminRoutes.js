const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAllDoctors,
  toggleDoctorStatus,
  getAllPatients,
  getActivityLogs
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);
router.use(restrictTo('Admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/doctors', getAllDoctors);
router.put('/doctors/:id/toggle', toggleDoctorStatus);
router.get('/patients', getAllPatients);
router.get('/logs', getActivityLogs);

module.exports = router;
