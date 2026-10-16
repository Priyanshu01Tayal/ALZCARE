const mongoose = require('mongoose');

const GameResultSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameAssignment',
    required: false,
    default: null
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  gameName: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    default: 'Medium'
  },
  completionDate: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    required: true // percentage, e.g. 85
  },
  timeTaken: {
    type: Number,
    required: true // in seconds
  },
  moves: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GameResult', GameResultSchema);
