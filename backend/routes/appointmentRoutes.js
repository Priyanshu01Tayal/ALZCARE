const express = require('express');
const router = express.Router();
const {
  getAppointments,
  bookAppointment,
  updateAppointment,
  updateAppointmentStatus,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getAppointments)
  .post(protect, bookAppointment);

router.route('/patient/:patientId')
  .get(protect, getAppointments);

router.route('/:id')
  .put(protect, updateAppointment)
  .patch(protect, updateAppointment);

router.route('/:id/status')
  .put(protect, updateAppointmentStatus)
  .patch(protect, updateAppointmentStatus);

module.exports = router;
