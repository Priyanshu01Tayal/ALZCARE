const express = require('express');
const router = express.Router();
const {
  getAppointments,
  bookAppointment,
  updateAppointmentStatus,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getAppointments)
  .post(protect, bookAppointment);

router.route('/:id/status')
  .put(protect, updateAppointmentStatus);

module.exports = router;
