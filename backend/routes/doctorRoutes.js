const express = require('express');
const router = express.Router();
const {
  getGameProgress,
  assignGame,
  getDoctorPatientActivity,
} = require('../controllers/gameController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Doctor endpoints for patient cognitive rehabilitation
router.get('/activity', protect, restrictTo('Doctor'), getDoctorPatientActivity);

router.get(
  '/patients/:patientId/game-progress',
  protect,
  restrictTo('Doctor'),
  getGameProgress
);

router.post(
  '/patients/:patientId/games',
  protect,
  restrictTo('Doctor'),
  assignGame
);

module.exports = router;
