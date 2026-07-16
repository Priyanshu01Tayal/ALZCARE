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
