const express = require('express');
const router = express.Router();
const {
  assignGame,
  getGameAssignmentsByPatient,
  submitGameResult,
  getGameResultsByPatient
} = require('../controllers/gameController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/assign', protect, restrictTo('Doctor'), assignGame);
router.get('/patient/:patientId', protect, getGameAssignmentsByPatient);
router.post('/result', protect, restrictTo('Patient'), submitGameResult);
router.get('/results/:patientId', protect, getGameResultsByPatient);

module.exports = router;
