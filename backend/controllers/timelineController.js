const MriReport = require('../models/MriReport');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const GameAssignment = require('../models/GameAssignment');
const GameResult = require('../models/GameResult');
const Patient = require('../models/Patient');

// @desc    Get chronological patient timeline events
// @route   GET /api/timeline/:patientId
// @access  Private
const getPatientTimeline = async (req, res) => {
  const { patientId } = req.params;

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Role authentication
    if (req.role === 'Doctor' && patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this patient timeline' });
    }
    if (req.role === 'Patient' && patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view your timeline' });
    }

    // Fetch all related documents
    const [mris, prescriptions, appts, gameAssigns, gameResults] = await Promise.all([
      MriReport.find({ patientId }),
      Prescription.find({ patientId }),
      Appointment.find({ patientId }),
      GameAssignment.find({ patientId }),
      GameResult.find({ patientId })
    ]);

    const timelineEvents = [];

    // 1. MRI reports
    mris.forEach(m => {
      // MRI Uploaded Event
      timelineEvents.push({
        _id: `mri-up-${m._id}`,
        type: 'MRI Uploaded',
        title: `MRI Scan Uploaded (${m.mriId || 'Pending ID'})`,
        date: m.createdAt,
        details: `File: ${m.fileName}`,
        status: m.status
      });

      // Future MRI Analysis Event placeholder
      timelineEvents.push({
        _id: `mri-ai-${m._id}`,
        type: 'MRI Analysis (Future)',
        title: `MRI AI Diagnostic Analysis`,
        date: m.createdAt,
        details: m.result || 'Analysis Pending - Reserved for Future AI Model',
        status: m.status === 'Completed' ? 'Completed' : 'Pending'
      });
    });

    // 2. Prescriptions
    prescriptions.forEach(p => {
      const medsList = p.medications.map(m => `${m.name} (${m.dosage})`).join(', ');
      timelineEvents.push({
        _id: `pres-${p._id}`,
        type: 'Prescription Added',
        title: `Therapeutics Prescription Formed`,
        date: p.date || p.createdAt,
        details: medsList ? `Medications: ${medsList}. Notes: ${p.notes}` : `Notes: ${p.notes}`,
        status: 'Completed'
      });
    });

    // 3. Appointments
    appts.forEach(a => {
      // Event for Booking
      timelineEvents.push({
        _id: `appt-bk-${a._id}`,
        type: 'Appointment Booked',
        title: `Checkup Visit Booked`,
        date: a.createdAt,
        details: `Scheduled date: ${new Date(a.date).toLocaleDateString()} at ${a.timeSlot}. Reason: ${a.reason}`,
        status: 'Completed'
      });

      // Event for Completion
      if (a.status === 'Completed') {
        timelineEvents.push({
          _id: `appt-cp-${a._id}`,
          type: 'Appointment Completed',
          title: `Checkup Visit Completed`,
          date: a.date, // Use the appointment date as the completion date
          details: `Consultation completed with primary physician.`,
          status: 'Completed'
        });
      } else if (a.status === 'Cancelled') {
        timelineEvents.push({
          _id: `appt-cx-${a._id}`,
          type: 'Appointment Cancelled',
          title: `Checkup Visit Cancelled`,
          date: a.updatedAt,
          details: `Meeting slot cancelled.`,
          status: 'Cancelled'
        });
      }
    });

    // 4. Game Assignments
    gameAssigns.forEach(g => {
      timelineEvents.push({
        _id: `game-as-${g._id}`,
        type: 'Game Assigned',
        title: `Cognitive Task Assigned`,
        date: g.assignedAt,
        details: `Game: ${g.gameName} (Difficulty: ${g.difficulty}). Due Date: ${g.dueDate ? new Date(g.dueDate).toLocaleDateString() : 'N/A'}`,
        status: g.status
      });
    });

    // 5. Game Results
    gameResults.forEach(r => {
      timelineEvents.push({
        _id: `game-rs-${r._id}`,
        type: 'Game Completed',
        title: `Cognitive Task Completed`,
        date: r.completionDate,
        details: `Game: ${r.gameName} | Score: ${r.score} | Accuracy: ${r.accuracy}% | Duration: ${r.timeTaken} seconds`,
        status: 'Completed'
      });
    });

    // Sort events by date descending (newest first)
    timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(timelineEvents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPatientTimeline
};
