const express = require('express');
const router = express.Router();
const {
  getPrescriptionsByPatient,
  createPrescription,
} = require('../controllers/prescriptionController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/', protect, restrictTo('Doctor'), createPrescription);
router.get('/patient/:patientId', protect, getPrescriptionsByPatient);

module.exports = router;
