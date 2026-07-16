const mongoose = require('mongoose');

const mriReportSchema = mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Error'],
      default: 'Pending',
    },
    result: {
      type: String,
      default: 'Analysis Pending - Reserved for Future AI Model',
    },
    mriId: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Counter = require('./Counter');

mriReportSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: 'mriId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const padNum = String(counter.seq).padStart(4, '0');
      this.mriId = `MRI-2026-${padNum}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('MriReport', mriReportSchema);

