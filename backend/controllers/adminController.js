const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const MriReport = require('../models/MriReport');
const Appointment = require('../models/Appointment');
const ActivityLog = require('../models/ActivityLog');
const logActivity = require('../utils/activityLogger');

// @desc    Get admin dashboard analytics & recent logs
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
  try {
    const [totalDoctors, totalPatients, totalMris, totalAppts, recentLogs] = await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
      MriReport.countDocuments(),
      Appointment.countDocuments(),
      ActivityLog.find().sort({ createdAt: -1 }).limit(20)
    ]);

    res.json({
      totalDoctors,
      totalPatients,
      totalMris,
      totalAppts,
      recentLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get list of all doctors
// @route   GET /api/admin/doctors
// @access  Private/Admin
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().select('-password');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle doctor active/inactive status
// @route   PUT /api/admin/doctors/:id/toggle
// @access  Private/Admin
const toggleDoctorStatus = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.isActive = !doctor.isActive;
    await doctor.save();

    await logActivity(
      req.user._id,
      'Admin',
      'Doctor Status Toggled',
      `Doctor ${doctor.name} (${doctor.email}) account status updated to: ${doctor.isActive ? 'ACTIVE' : 'DEACTIVATED'}`
    );

    res.json({ message: `Doctor account status updated to ${doctor.isActive ? 'Active' : 'Deactivated'}`, doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all patients in the system
// @route   GET /api/admin/patients
// @access  Private/Admin
const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().select('-password').populate('doctorId', 'name specialization');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all activity logs
// @route   GET /api/admin/logs
// @access  Private/Admin
const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdminDashboard,
  getAllDoctors,
  toggleDoctorStatus,
  getAllPatients,
  getActivityLogs
};
