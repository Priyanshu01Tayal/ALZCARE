const express = require('express');
const router = express.Router();
const {
  getGameCatalog,
  assignGame,
  getGameAssignmentsByPatient,
  getPatientGamesWithCatalog,
  submitGameResult,
  getGameResultsByPatient,
  getGameProgress,
} = require('../controllers/gameController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public or protected catalog
router.get('/catalog', getGameCatalog);

// Existing game routes
router.post('/assign', protect, restrictTo('Doctor'), assignGame);
router.get('/patient/:patientId', protect, getGameAssignmentsByPatient);
router.get('/patient/:patientId/list', protect, getPatientGamesWithCatalog);
router.post('/result', protect, restrictTo('Patient'), submitGameResult);
router.get('/results/:patientId', protect, getGameResultsByPatient);

// Progress analytics
router.get('/progress/:patientId', protect, getGameProgress);

module.exports = router;
