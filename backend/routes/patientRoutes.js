const express = require('express');
const router = express.Router();
const {
  getPatients,
  getPatientById,
  addPatient,
  updatePatient,
  deletePatient,
  getPatientMe,
  updatePatientMe,
  getPatientDoctor,
  changePatientPassword,
} = require('../controllers/patientController');
const {
  getPatientGamesWithCatalog,
  getGameAssignmentsByPatient,
  getGameProgress,
} = require('../controllers/gameController');
const { getAppointments } = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Patient self-access endpoints (must be defined before /:id)
router.get('/me', protect, restrictTo('Patient'), getPatientMe);
router.put('/me', protect, restrictTo('Patient'), updatePatientMe);
router.put('/me/password', protect, restrictTo('Patient'), changePatientPassword);
router.get('/me/doctor', protect, restrictTo('Patient'), getPatientDoctor);
router.get('/me/games', protect, restrictTo('Patient'), getPatientGamesWithCatalog);
router.get('/me/game-assignments', protect, restrictTo('Patient'), getGameAssignmentsByPatient);
router.get('/me/game-progress', protect, restrictTo('Patient'), getGameProgress);
router.get('/me/appointments', protect, restrictTo('Patient'), getAppointments);

// Doctor patient management endpoints
router.route('/')
  .get(protect, restrictTo('Doctor'), getPatients)
  .post(protect, restrictTo('Doctor'), addPatient);

router.route('/:id')
  .get(protect, getPatientById)
  .put(protect, restrictTo('Doctor'), updatePatient)
  .delete(protect, restrictTo('Doctor'), deletePatient);

module.exports = router;
