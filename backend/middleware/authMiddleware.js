const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Admin = require('../models/Admin');


const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'alzcare_secret_key_2026');

      if (decoded.role === 'Doctor') {
        req.user = await Doctor.findById(decoded.id).select('-password');
        req.role = 'Doctor';
      } else if (decoded.role === 'Patient') {
        req.user = await Patient.findById(decoded.id).select('-password');
        req.role = 'Patient';
      } else if (decoded.role === 'Admin') {
        req.user = await Admin.findById(decoded.id).select('-password');
        req.role = 'Admin';
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Auth Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({
        message: `Role (${req.role}) is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
