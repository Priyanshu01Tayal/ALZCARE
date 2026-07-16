const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const logActivity = require('../utils/activityLogger');

// @desc    Get prescriptions for a patient
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private
const getPrescriptionsByPatient = async (req, res) => {
  const { patientId } = req.params;

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.role === 'Doctor' && patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view records for this patient' });
    }
    if (req.role === 'Patient' && patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these records' });
    }

    const prescriptions = await Prescription.find({ patientId }).sort({ date: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private/Doctor
const createPrescription = async (req, res) => {
  const { patientId, notes, medications } = req.body;

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Patient is not assigned to you' });
    }

    const prescription = await Prescription.create({
      patientId,
      doctorId: req.user._id,
      notes,
      medications,
    });

    await Notification.create({
      userId: patientId,
      userType: 'Patient',
      message: `Dr. ${req.user.name} added a new prescription and diagnosis note.`,
    });

    await logActivity(
      req.user._id,
      'Doctor',
      'Prescription Added',
      `Dr. ${req.user.name} added prescription to Patient ${patient.name} (${patient.patientId})`
    );

    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPrescriptionsByPatient,
  createPrescription,
};
