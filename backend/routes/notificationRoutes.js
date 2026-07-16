const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markNotificationRead);

module.exports = router;
