const mongoose = require('mongoose');

const gameAssignmentSchema = mongoose.Schema(
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
    gameName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Assigned', 'Completed'],
      default: 'Assigned',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    dueDate: {
      type: Date,
    },
    frequency: {
      type: String,
      enum: ['Daily', 'Twice a week', 'Weekly', 'Once'],
      default: 'Daily',
    },
    repetitions: {
      type: Number,
      default: 1,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GameAssignment', gameAssignmentSchema);
