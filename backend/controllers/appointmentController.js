const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const logActivity = require('../utils/activityLogger');

// @desc    Get all appointments (Doctor or Patient)
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    let appointments;
    if (req.role === 'Doctor') {
      appointments = await Appointment.find({ doctorId: req.user._id })
        .populate('patientId', 'name email age gender patientId')
        .sort({ date: 1, timeSlot: 1 });
    } else {
      appointments = await Appointment.find({ patientId: req.user._id })
        .populate('doctorId', 'name email specialization')
        .sort({ date: 1, timeSlot: 1 });
    }
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private
const bookAppointment = async (req, res) => {
  const { patientId, date, timeSlot, reason } = req.body;

  try {
    let pId, dId;

    if (req.role === 'Patient') {
      pId = req.user._id;
      dId = req.user.doctorId;
    } else {
      pId = patientId;
      dId = req.user._id;

      const patient = await Patient.findById(pId);
      if (!patient || patient.doctorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Patient not assigned to this doctor' });
      }
    }

    const appointment = await Appointment.create({
      patientId: pId,
      doctorId: dId,
      date,
      timeSlot,
      reason,
    });

    const targetPatient = await Patient.findById(pId);
    const targetDoctor = await Doctor.findById(dId);

    if (req.role === 'Patient') {
      await Notification.create({
        userId: dId,
        userType: 'Doctor',
        message: `New appointment booked by patient ${req.user.name} for ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
      });

      await logActivity(
        req.user._id,
        'Patient',
        'Appointment Booked',
        `Patient ${req.user.name} (${targetPatient.patientId}) booked a checkup for ${new Date(date).toLocaleDateString()} with Dr. ${targetDoctor.name}`
      );
    } else {
      await Notification.create({
        userId: pId,
        userType: 'Patient',
        message: `Dr. ${req.user.name} has scheduled an appointment for you on ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
      });

      await logActivity(
        req.user._id,
        'Doctor',
        'Appointment Booked',
        `Dr. ${req.user.name} scheduled an appointment for Patient ${targetPatient.name} (${targetPatient.patientId}) on ${new Date(date).toLocaleDateString()}`
      );
    }

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = async (req, res) => {
  const { status } = req.body;

  if (!['Scheduled', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (req.role === 'Doctor' && appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to change this status' });
    }
    if (req.role === 'Patient' && appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to change this status' });
    }

    if (status === 'Completed' && req.role !== 'Doctor') {
      return res.status(403).json({ message: 'Only doctors can mark appointments as completed' });
    }

    appointment.status = status;
    await appointment.save();

    const targetPatient = await Patient.findById(appointment.patientId);

    if (req.role === 'Doctor') {
      await Notification.create({
        userId: appointment.patientId,
        userType: 'Patient',
        message: `Your appointment on ${new Date(appointment.date).toLocaleDateString()} has been marked as ${status} by Dr. ${req.user.name}.`,
      });

      await logActivity(
        req.user._id,
        'Doctor',
        status === 'Completed' ? 'Appointment Completed' : 'Appointment Cancelled',
        `Dr. ${req.user.name} marked appointment with ${targetPatient.name} (${targetPatient.patientId}) as ${status.toUpperCase()}`
      );
    } else {
      await Notification.create({
        userId: appointment.doctorId,
        userType: 'Doctor',
        message: `Appointment on ${new Date(appointment.date).toLocaleDateString()} has been marked as ${status} by patient.`,
      });

      await logActivity(
        req.user._id,
        'Patient',
        'Appointment Cancelled',
        `Patient ${req.user.name} (${targetPatient.patientId}) marked appointment on ${new Date(appointment.date).toLocaleDateString()} as ${status.toUpperCase()}`
      );
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAppointments,
  bookAppointment,
  updateAppointmentStatus,
};
