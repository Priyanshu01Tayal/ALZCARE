const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    age: {
      type: Number,
      required: [true, 'Please add age'],
    },
    gender: {
      type: String,
      required: [true, 'Please add gender'],
    },
    medicalHistory: {
      type: String,
      default: '',
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    patientId: {
      type: String,
      unique: true,
    },
    phone: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Pending'],
      default: 'Active',
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

patientSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Counter = require('./Counter');

patientSchema.pre('save', async function (next) {
  // Generate PAT-XXXX sequence
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: 'patientId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const padNum = String(counter.seq).padStart(4, '0');
      this.patientId = `PAT-${padNum}`;
    } catch (err) {
      return next(err);
    }
  }

  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('Patient', patientSchema);

