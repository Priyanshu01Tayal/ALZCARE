const GameAssignment = require('../models/GameAssignment');
const GameResult = require('../models/GameResult');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const logActivity = require('../utils/activityLogger');

const GAME_CATALOG = [
  {
    id: 'memory-match',
    gameName: 'Memory Match',
    category: 'Visual Working Memory',
    difficulty: 'Medium',
    icon: 'brain',
    description: 'Flip and match paired neuro-cognitive cards to stimulate pattern retention and associative memory recall.',
    instructions: 'Tap cards to flip them. Remember their positions and find all matching pairs in the fewest moves.',
    scoringRules: 'Points awarded for rapid completion and penalized for excess moves. Accuracy reflects optimal matches vs moves made.'
  },
  {
    id: 'visual-search',
    gameName: 'Visual Search',
    category: 'Attention & Focus',
    difficulty: 'Medium',
    icon: 'search',
    description: 'Quickly detect and select the target cognitive stimulus amongst a field of distracting symbols.',
    instructions: 'Observe the target symbol shown at the top. Scan the grid and tap all instances before the timer runs out.',
    scoringRules: 'Earn points for correct targets identified. False taps reduce accuracy.'
  },
  {
    id: 'speed-tap',
    gameName: 'Speed Tap',
    category: 'Motor Reflex & Processing Speed',
    difficulty: 'Easy',
    icon: 'zap',
    description: 'React rapidly to illuminated sensory nodes to test motor coordination and psychomotor agility.',
    instructions: 'Tap the highlighted active node as soon as it lights up. Act quickly before it moves to another position.',
    scoringRules: 'Scored on response reaction speed in milliseconds and hit percentage.'
  },
  {
    id: 'pattern-sequence',
    gameName: 'Pattern Sequence',
    category: 'Executive Function & Working Memory',
    difficulty: 'Hard',
    icon: 'layers',
    description: 'Observe and repeat an escalating sequence of visual-auditory stimuli to exercise sequential memory capacity.',
    instructions: 'Watch the sequence light up in order. Once finished, repeat the exact sequence by tapping the color pads.',
    scoringRules: 'Scored by the length of correct sequence levels achieved and recall precision.'
  }
];

// @desc    Get all available cognitive games catalog
// @route   GET /api/games/catalog
// @access  Public or Private
const getGameCatalog = (req, res) => {
  res.json(GAME_CATALOG);
};

// @desc    Assign game to patient (Doctor only)
// @route   POST /api/games/assign
// @access  Private/Doctor
const assignGame = async (req, res) => {
  const {
    patientId: bodyPatientId,
    gameName,
    difficulty,
    dueDate,
    frequency,
    repetitions,
    startDate,
    notes,
  } = req.body;

  const targetPatientId = req.params.patientId || bodyPatientId;

  try {
    const patient = await Patient.findById(targetPatientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Patient is not assigned to you' });
    }

    const assignment = await GameAssignment.create({
      patientId: targetPatientId,
      doctorId: req.user._id,
      gameName,
      difficulty: difficulty || 'Medium',
      dueDate: dueDate || null,
      frequency: frequency || 'Daily',
      repetitions: repetitions ? Number(repetitions) : 1,
      startDate: startDate || Date.now(),
      notes: notes || '',
      status: 'Assigned',
    });

    await Notification.create({
      userId: targetPatientId,
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
  const patientId = req.params.patientId || (req.role === 'Patient' ? req.user._id : null);

  if (!patientId) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.role === 'Doctor' && (!patient.doctorId || patient.doctorId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view games for this patient' });
    }
    if (req.role === 'Patient' && (!patient._id || patient._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view assigned games' });
    }

    const assignments = await GameAssignment.find({ patientId }).sort({ assignedAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient games merged with catalog, assignment status, and performance stats
// @route   GET /api/games/patient/:patientId/list or /api/patients/me/games
// @access  Private
const getPatientGamesWithCatalog = async (req, res) => {
  const patientId = req.params.patientId || (req.role === 'Patient' ? req.user._id : null);

  if (!patientId) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.role === 'Doctor' && (!patient.doctorId || patient.doctorId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view games for this patient' });
    }
    if (req.role === 'Patient' && (!patient._id || patient._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view games' });
    }

    const assignments = await GameAssignment.find({ patientId }).sort({ createdAt: -1 });
    const results = await GameResult.find({ patientId }).sort({ completionDate: -1 });

    const gamesList = GAME_CATALOG.map((catGame) => {
      // Find latest assignment for this game
      const relevantAssignments = assignments.filter((a) => a.gameName.toLowerCase() === catGame.gameName.toLowerCase());
      const activeAssignment = relevantAssignments.find((a) => a.status === 'Assigned') || relevantAssignments[0];

      // Results for this game
      const gameResults = results.filter((r) => r.gameName.toLowerCase() === catGame.gameName.toLowerCase());
      const attempts = gameResults.length;
      const bestScore = attempts > 0 ? Math.max(...gameResults.map((r) => r.score || 0)) : 0;
      const totalScore = gameResults.reduce((acc, r) => acc + (r.score || 0), 0);
      const averageScore = attempts > 0 ? Math.round(totalScore / attempts) : 0;
      const latestResult = gameResults[0] || null;

      const isAssigned = !!activeAssignment && activeAssignment.status === 'Assigned';

      return {
        ...catGame,
        isAssigned,
        assignmentId: activeAssignment ? activeAssignment._id : null,
        assignmentStatus: activeAssignment ? activeAssignment.status : 'None',
        assignedDifficulty: activeAssignment ? activeAssignment.difficulty : catGame.difficulty,
        dueDate: activeAssignment ? activeAssignment.dueDate : null,
        frequency: activeAssignment ? activeAssignment.frequency : 'Daily',
        attempts,
        lastScore: latestResult ? latestResult.score : 0,
        bestScore,
        averageScore,
        lastPlayed: latestResult ? latestResult.completionDate : null,
      };
    });

    res.json({
      games: gamesList,
      assignments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit cognitive game completion result (Patient only)
// @route   POST /api/games/result
// @access  Private/Patient
const submitGameResult = async (req, res) => {
  const {
    assignmentId,
    gameId,
    gameName,
    score,
    accuracy,
    timeTaken,
    duration,
    moves,
    difficulty,
  } = req.body;

  try {
    let resolvedAssignment = null;
    const targetAssignmentId = assignmentId || gameId;

    if (targetAssignmentId) {
      try {
        resolvedAssignment = await GameAssignment.findById(targetAssignmentId);
      } catch (e) {
        // Not a valid ObjectId or not found
      }
    }

    // If assignment found, check ownership
    if (resolvedAssignment) {
      if (resolvedAssignment.patientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to complete this game' });
      }
      resolvedAssignment.status = 'Completed';
      resolvedAssignment.completedAt = Date.now();
      await resolvedAssignment.save();
    } else {
      // Check if there is an open assignment for this gameName
      const resolvedName = gameName || (resolvedAssignment ? resolvedAssignment.gameName : 'Cognitive Exercise');
      const pendingAssignment = await GameAssignment.findOne({
        patientId: req.user._id,
        gameName: { $regex: new RegExp(`^${resolvedName}$`, 'i') },
        status: 'Assigned',
      }).sort({ createdAt: -1 });

      if (pendingAssignment) {
        pendingAssignment.status = 'Completed';
        pendingAssignment.completedAt = Date.now();
        await pendingAssignment.save();
        resolvedAssignment = pendingAssignment;
      }
    }

    const resolvedGameName = resolvedAssignment ? resolvedAssignment.gameName : (gameName || 'Cognitive Exercise');
    const finalScore = Number(score) || 0;
    const finalAccuracy = Number(accuracy) || 0;
    const finalTimeTaken = Number(timeTaken !== undefined ? timeTaken : (duration !== undefined ? duration : 0));
    const finalDifficulty = difficulty || (resolvedAssignment ? resolvedAssignment.difficulty : 'Medium');

    // Deduplication check: Guard against rapid duplicate submissions (within 5 seconds)
    const recentDuplicate = await GameResult.findOne({
      patientId: req.user._id,
      gameName: resolvedGameName,
      score: finalScore,
      createdAt: { $gte: new Date(Date.now() - 5000) },
    });

    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        assignment: resolvedAssignment,
        result: recentDuplicate,
        deduplicated: true,
      });
    }

    const result = await GameResult.create({
      assignmentId: resolvedAssignment ? resolvedAssignment._id : null,
      patientId: req.user._id,
      gameName: resolvedGameName,
      difficulty: finalDifficulty,
      score: finalScore,
      accuracy: finalAccuracy,
      timeTaken: finalTimeTaken,
      moves: moves ? Number(moves) : 0,
    });

    // Notify doctor
    const targetDoctorId = resolvedAssignment ? resolvedAssignment.doctorId : req.user.doctorId;
    if (targetDoctorId) {
      await Notification.create({
        userId: targetDoctorId,
        userType: 'Doctor',
        message: `Your patient ${req.user.name} completed "${resolvedGameName}" with Score: ${finalScore} (Accuracy: ${finalAccuracy}%).`,
      });
    }

    await logActivity(
      req.user._id,
      'Patient',
      'Game Completed',
      `Cognitive exercise "${resolvedGameName}" completed. Score: ${finalScore}, Accuracy: ${finalAccuracy}%, Duration: ${finalTimeTaken}s`
    );

    await Patient.findByIdAndUpdate(req.user._id, { $set: { lastActive: new Date() } });

    res.status(201).json({
      success: true,
      assignment: resolvedAssignment,
      result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get cognitive game performance history results
// @route   GET /api/games/results/:patientId
// @access  Private
const getGameResultsByPatient = async (req, res) => {
  const patientId = req.params.patientId || (req.role === 'Patient' ? req.user._id : null);

  if (!patientId) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.role === 'Doctor' && (!patient.doctorId || patient.doctorId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view game logs' });
    }
    if (req.role === 'Patient' && (!patient._id || patient._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view your performance data' });
    }

    const results = await GameResult.find({ patientId }).sort({ completionDate: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comprehensive cognitive game progress and analytics
// @route   GET /api/games/progress/:patientId
// @access  Private (Doctor or Patient themselves)
const getGameProgress = async (req, res) => {
  const patientId = req.params.patientId || (req.role === 'Patient' ? req.user._id : null);

  if (!patientId) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.role === 'Doctor' && (!patient.doctorId || patient.doctorId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view progress for this patient' });
    }
    if (req.role === 'Patient' && (!patient._id || patient._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this progress record' });
    }

    const assignments = await GameAssignment.find({ patientId }).sort({ createdAt: -1 });
    const results = await GameResult.find({ patientId }).sort({ completionDate: -1 });

    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter((a) => a.status === 'Completed').length;
    const totalPlayed = results.length;

    const bestScore = totalPlayed > 0 ? Math.max(...results.map((r) => r.score || 0)) : 0;
    const avgScore = totalPlayed > 0 ? Math.round(results.reduce((acc, r) => acc + (r.score || 0), 0) / totalPlayed) : 0;
    const avgAccuracy = totalPlayed > 0 ? Math.round(results.reduce((acc, r) => acc + (r.accuracy || 0), 0) / totalPlayed) : 0;
    const avgTime = totalPlayed > 0 ? Math.round(results.reduce((acc, r) => acc + (r.timeTaken || 0), 0) / totalPlayed) : 0;
    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    // Game-wise aggregation
    const gameWise = GAME_CATALOG.map((catGame) => {
      const gameResults = results.filter((r) => r.gameName.toLowerCase() === catGame.gameName.toLowerCase());
      const gameAssignments = assignments.filter((a) => a.gameName.toLowerCase() === catGame.gameName.toLowerCase());

      const attempts = gameResults.length;
      const gameBest = attempts > 0 ? Math.max(...gameResults.map((r) => r.score || 0)) : 0;
      const gameAvg = attempts > 0 ? Math.round(gameResults.reduce((acc, r) => acc + (r.score || 0), 0) / attempts) : 0;
      const gameAvgAcc = attempts > 0 ? Math.round(gameResults.reduce((acc, r) => acc + (r.accuracy || 0), 0) / attempts) : 0;
      const latestResult = gameResults[0] || null;
      const hasActiveAssignment = gameAssignments.some((a) => a.status === 'Assigned');

      return {
        gameName: catGame.gameName,
        category: catGame.category,
        difficulty: catGame.difficulty,
        isAssigned: hasActiveAssignment,
        completedCount: gameAssignments.filter((a) => a.status === 'Completed').length,
        attempts,
        bestScore: gameBest,
        averageScore: gameAvg,
        averageAccuracy: gameAvgAcc,
        lastScore: latestResult ? latestResult.score : 0,
        lastPlayed: latestResult ? latestResult.completionDate : null,
      };
    });

    res.json({
      patient: {
        _id: patient._id,
        name: patient.name,
        patientId: patient.patientId,
      },
      summary: {
        totalAssignments,
        completedAssignments,
        totalPlayed,
        bestScore,
        averageScore: avgScore,
        averageAccuracy: avgAccuracy,
        averageTime: avgTime,
        completionRate,
      },
      gameWise,
      recentResults: results.slice(0, 15),
      assignments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recent mobile game activity across all doctor's patients
// @route   GET /api/doctors/activity
// @access  Private/Doctor
const getDoctorPatientActivity = async (req, res) => {
  try {
    const patients = await Patient.find({ doctorId: req.user._id }).select('_id name patientId lastActive');
    const patientIds = patients.map((p) => p._id);

    const recentResults = await GameResult.find({ patientId: { $in: patientIds } })
      .populate('patientId', 'name patientId')
      .sort({ completionDate: -1 })
      .limit(10);

    const activeAssignments = await GameAssignment.find({ doctorId: req.user._id, status: 'Assigned' })
      .populate('patientId', 'name patientId')
      .sort({ assignedAt: -1 })
      .limit(10);

    res.json({
      recentResults,
      activeAssignments,
      patients,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGameCatalog,
  assignGame,
  getGameAssignmentsByPatient,
  getPatientGamesWithCatalog,
  submitGameResult,
  getGameResultsByPatient,
  getGameProgress,
  getDoctorPatientActivity,
};
