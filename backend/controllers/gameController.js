const GameAssignment = require('../models/GameAssignment');
const GameResult = require('../models/GameResult');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const logActivity = require('../utils/activityLogger');

// @desc    Assign game to patient (Doctor only)
// @route   POST /api/games/assign
// @access  Private/Doctor
const assignGame = async (req, res) => {
  const { patientId, gameName, difficulty, dueDate } = req.body;

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Patient is not assigned to you' });
    }

    const assignment = await GameAssignment.create({
      patientId,
      doctorId: req.user._id,
      gameName,
      difficulty: difficulty || 'Medium',
      dueDate: dueDate || null,
      status: 'Assigned',
    });

    await Notification.create({
      userId: patientId,
      userType: 'Patient',
      message: `Dr. ${req.user.name} assigned a new cognitive game to you: ${gameName} (${difficulty || 'Medium'} difficulty).`,
    });

    await logActivity(
      req.user._id,
      'Doctor',
      'Game Assigned',
      `Cognitive exercise "${gameName}" assigned to Patient ${patient.name} (${patient.patientId})`
    );

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get cognitive games assigned to patient
// @route   GET /api/games/patient/:patientId
// @access  Private
const getGameAssignmentsByPatient = async (req, res) => {
  const { patientId } = req.params;

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.role === 'Doctor' && patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view games for this patient' });
    }
    if (req.role === 'Patient' && patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view assigned games' });
    }

    const assignments = await GameAssignment.find({ patientId }).sort({ assignedAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit cognitive game completion result (Patient only)
// @route   POST /api/games/result
// @access  Private/Patient
const submitGameResult = async (req, res) => {
  const { assignmentId, score, accuracy, timeTaken } = req.body;

  try {
    const assignment = await GameAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Game assignment not found' });
    }

    if (assignment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this game' });
    }

    assignment.status = 'Completed';
    assignment.completedAt = Date.now();
    await assignment.save();

    const result = await GameResult.create({
      assignmentId,
      patientId: req.user._id,
      gameName: assignment.gameName,
      score,
      accuracy,
      timeTaken
    });

    await Notification.create({
      userId: assignment.doctorId,
      userType: 'Doctor',
      message: `Your patient ${req.user.name} has completed the assigned game: ${assignment.gameName} with score ${score} (Accuracy: ${accuracy}%).`,
    });

    await logActivity(
      req.user._id,
      'Patient',
      'Game Completed',
      `Cognitive exercise "${assignment.gameName}" completed. Score: ${score}, Accuracy: ${accuracy}%, Duration: ${timeTaken}s`
    );

    res.status(201).json({ assignment, result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get cognitive game performance history results
// @route   GET /api/games/results/:patientId
// @access  Private
const getGameResultsByPatient = async (req, res) => {
  const { patientId } = req.params;

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.role === 'Doctor' && patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view game logs' });
    }
    if (req.role === 'Patient' && patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view your performance data' });
    }

    const results = await GameResult.find({ patientId }).sort({ completionDate: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  assignGame,
  getGameAssignmentsByPatient,
  submitGameResult,
  getGameResultsByPatient
};
