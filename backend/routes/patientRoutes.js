const express = require('express');
const router = express.Router();
const {
  getPatients,
  getPatientById,
  addPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patientController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, restrictTo('Doctor'), getPatients)
  .post(protect, restrictTo('Doctor'), addPatient);

router.route('/:id')
  .get(protect, getPatientById)
  .put(protect, restrictTo('Doctor'), updatePatient)
  .delete(protect, restrictTo('Doctor'), deletePatient);

module.exports = router;
