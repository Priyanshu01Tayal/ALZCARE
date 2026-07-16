const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');
const MriReport = require('../models/MriReport');
const GameAssignment = require('../models/GameAssignment');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const logActivity = require('../utils/activityLogger');

// @desc    Get all patients assigned to doctor
// @route   GET /api/patients
// @access  Private/Doctor
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ doctorId: req.user._id }).select('-password');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient detailed clinical records
// @route   GET /api/patients/:id
// @access  Private (Doctor or Patient themselves)
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select('-password');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Role-based authorization
    if (req.role === 'Doctor' && patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this patient' });
    }
    if (req.role === 'Patient' && patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this record' });
    }

    const doctor = await Doctor.findById(patient.doctorId).select('name email specialization');
    const prescriptions = await Prescription.find({ patientId: patient._id }).sort({ date: -1 });
    const mris = await MriReport.find({ patientId: patient._id }).sort({ createdAt: -1 });
    const games = await GameAssignment.find({ patientId: patient._id }).sort({ assignedAt: -1 });
    const appointments = await Appointment.find({ patientId: patient._id }).sort({ date: 1 });

    res.json({
      patient,
      doctor,
      prescriptions,
      mris,
      games,
      appointments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a patient (Doctor only)
// @route   POST /api/patients
// @access  Private/Doctor
const addPatient = async (req, res) => {
  const { name, email, password, age, gender, medicalHistory } = req.body;

  try {
    // Check if user exists
    const patientExists = await Patient.findOne({ email });
    const doctorExists = await Doctor.findOne({ email });

    if (patientExists || doctorExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const patient = await Patient.create({
      name,
      email,
      password,
      age,
      gender,
      medicalHistory,
      doctorId: req.user._id,
    });

    if (patient) {
      // Create a notification for the patient
      await Notification.create({
        userId: patient._id,
        userType: 'Patient',
        message: `Welcome to AlzCare! Dr. ${req.user.name} has created your profile. You can log in with your credentials.`,
      });

      await logActivity(
        req.user._id,
        'Doctor',
        'Patient Registered',
        `Patient ${patient.name} (${patient.patientId}) was registered by Dr. ${req.user.name}`
      );

      res.status(201).json({
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        age: patient.age,
        gender: patient.gender,
        medicalHistory: patient.medicalHistory,
        doctorId: patient.doctorId,
        patientId: patient.patientId
      });
    } else {
      res.status(400).json({ message: 'Invalid patient data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update patient details (Doctor only)
// @route   PUT /api/patients/:id
// @access  Private/Doctor
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Verify ownership
    if (patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this patient' });
    }

    patient.name = req.body.name || patient.name;
    patient.age = req.body.age || patient.age;
    patient.gender = req.body.gender || patient.gender;
    patient.medicalHistory = req.body.medicalHistory !== undefined ? req.body.medicalHistory : patient.medicalHistory;

    // Only update email if it doesn't clash
    if (req.body.email && req.body.email !== patient.email) {
      const emailExists = await Patient.findOne({ email: req.body.email }) || await Doctor.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      patient.email = req.body.email;
    }

    // Update password if provided
    if (req.body.password) {
      patient.password = req.body.password;
    }

    const updatedPatient = await patient.save();

    await logActivity(
      req.user._id,
      'Doctor',
      'Patient Profile Updated',
      `Patient ${updatedPatient.name} (${updatedPatient.patientId}) profile updated by Dr. ${req.user.name}`
    );

    res.json({
      _id: updatedPatient._id,
      name: updatedPatient.name,
      email: updatedPatient.email,
      age: updatedPatient.age,
      gender: updatedPatient.gender,
      medicalHistory: updatedPatient.medicalHistory,
      patientId: updatedPatient.patientId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete patient (Doctor only)
// @route   DELETE /api/patients/:id
// @access  Private/Doctor
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Verify ownership
    if (patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this patient' });
    }

    await Patient.findByIdAndDelete(req.params.id);
    
    // Clean up patient documents
    await Prescription.deleteMany({ patientId: req.params.id });
    await MriReport.deleteMany({ patientId: req.params.id });
    await GameAssignment.deleteMany({ patientId: req.params.id });
    await Appointment.deleteMany({ patientId: req.params.id });
    await Notification.deleteMany({ userId: req.params.id });

    await logActivity(
      req.user._id,
      'Doctor',
      'Patient Deleted',
      `Patient ${patient.name} (${patient.patientId}) and all linked records deleted by Dr. ${req.user.name}`
    );

    res.json({ message: 'Patient and all associated records removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPatients,
  getPatientById,
  addPatient,
  updatePatient,
  deletePatient,
};
