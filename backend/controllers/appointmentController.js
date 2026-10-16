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
      const filter = { doctorId: req.user._id };
      const targetPatientId = req.query.patientId || req.params.patientId;
      if (targetPatientId) {
        filter.patientId = targetPatientId;
      }
      appointments = await Appointment.find(filter)
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
  const { patientId, date, timeSlot, reason, notes } = req.body;

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
      notes: notes || '',
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

      await Patient.findByIdAndUpdate(req.user._id, { $set: { lastActive: new Date() } });
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

      await Patient.findByIdAndUpdate(req.user._id, { $set: { lastActive: new Date() } });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment details (reschedule, notes, timeSlot)
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (req.role === 'Doctor' && appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this appointment' });
    }
    if (req.role === 'Patient' && appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this appointment' });
    }

    const { date, timeSlot, reason, notes, status } = req.body;
    if (date) appointment.date = date;
    if (timeSlot) appointment.timeSlot = timeSlot;
    if (reason) appointment.reason = reason;
    if (notes !== undefined) appointment.notes = notes;
    if (status) {
      if (['Scheduled', 'Completed', 'Cancelled'].includes(status)) {
        if (status === 'Completed' && req.role !== 'Doctor') {
          return res.status(403).json({ message: 'Only doctors can mark appointments as completed' });
        }
        appointment.status = status;
      }
    }

    await appointment.save();

    const targetPatient = await Patient.findById(appointment.patientId);

    if (req.role === 'Doctor') {
      await Notification.create({
        userId: appointment.patientId,
        userType: 'Patient',
        message: `Your appointment has been updated by Dr. ${req.user.name}. Date: ${new Date(appointment.date).toLocaleDateString()}, Time: ${appointment.timeSlot}.`,
      });

      await logActivity(
        req.user._id,
        'Doctor',
        'Appointment Updated',
        `Dr. ${req.user.name} updated appointment for Patient ${targetPatient?.name || 'Patient'} on ${new Date(appointment.date).toLocaleDateString()}`
      );
    } else {
      await Patient.findByIdAndUpdate(req.user._id, { $set: { lastActive: new Date() } });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAppointments,
  bookAppointment,
  updateAppointment,
  updateAppointmentStatus,
};
