const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const logActivity = require('../utils/activityLogger');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'alzcare_secret_key_2026', {
    expiresIn: '30d',
  });
};

// @desc    Register a new doctor
// @route   POST /api/auth/register/doctor
// @access  Public
const registerDoctor = async (req, res) => {
  const { name, email, password, specialization } = req.body;

  try {
    const doctorExists = await Doctor.findOne({ email });
    const patientExists = await Patient.findOne({ email });
    const adminExists = await Admin.findOne({ email });

    if (doctorExists || patientExists || adminExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const doctor = await Doctor.create({
      name,
      email,
      password,
      specialization,
    });

    if (doctor) {
      await logActivity(doctor._id, 'Doctor', 'Doctor Registered', `Doctor ${doctor.name} registered successfully`);
      res.status(201).json({
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        role: 'Doctor',
        token: generateToken(doctor._id, 'Doctor'),
      });
    } else {
      res.status(400).json({ message: 'Invalid doctor data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new admin
// @route   POST /api/auth/register/admin
// @access  Public
const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const doctorExists = await Doctor.findOne({ email });
    const patientExists = await Patient.findOne({ email });
    const adminExists = await Admin.findOne({ email });

    if (doctorExists || patientExists || adminExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const admin = await Admin.create({
      name,
      email,
      password,
    });

    if (admin) {
      await logActivity(admin._id, 'Admin', 'Admin Registered', `Admin ${admin.name} registered successfully`);
      res.status(201).json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'Admin',
        token: generateToken(admin._id, 'Admin'),
      });
    } else {
      res.status(400).json({ message: 'Invalid admin data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token (Admin, Doctor, or Patient)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, username, patientId: inputPatientId, password } = req.body;
  const rawIdentifier = (email || username || inputPatientId || '').trim();

  try {
    if (!rawIdentifier || !password) {
      return res.status(400).json({ message: 'Patient ID or email and password are required' });
    }

    const normalizedEmail = rawIdentifier.toLowerCase();
    const uppercaseId = rawIdentifier.toUpperCase();

    let user = await Admin.findOne({ email: normalizedEmail });
    let role = 'Admin';

    if (!user) {
      user = await Doctor.findOne({ email: normalizedEmail });
      role = 'Doctor';
    }

    if (!user) {
      // Search patient by either email or patientId (e.g. PAT-0001)
      user = await Patient.findOne({
        $or: [
          { email: normalizedEmail },
          { patientId: uppercaseId }
        ]
      });
      role = 'Patient';
    }

    if (user && (await user.matchPassword(password))) {
      // Check if Doctor is active
      if (role === 'Doctor' && user.isActive === false) {
        return res.status(403).json({ message: 'Your doctor account has been deactivated. Please contact the administrator.' });
      }

      // Check if Patient account is inactive
      if (role === 'Patient' && user.status === 'Inactive') {
        return res.status(403).json({ message: 'Your patient account has been deactivated. Please contact your physician.' });
      }

      await logActivity(user._id, role, 'User Logged In', `${role} ${user.name} logged in`);

      if (role === 'Patient') {
        await Patient.findByIdAndUpdate(user._id, { $set: { lastActive: new Date() } });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        patientId: user.patientId || undefined,
        role,
        status: user.status || 'Active',
        mustChangePassword: user.mustChangePassword || false,
        token: generateToken(user._id, role),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials. Please verify your Patient ID/email and password.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  if (req.user) {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.role,
      user: req.user,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

module.exports = {
  registerDoctor,
  registerAdmin,
  loginUser,
  getMe,
};
