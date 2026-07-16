const MriReport = require('../models/MriReport');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const logActivity = require('../utils/activityLogger');

// @desc    Upload MRI Report (Doctor only)
// @route   POST /api/mri/upload
// @access  Private/Doctor
const uploadMri = async (req, res) => {
  const { patientId } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an MRI file' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Patient is not assigned to you' });
    }

    const mriReport = await MriReport.create({
      patientId,
      doctorId: req.user._id,
      filePath: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      status: 'Pending',
      result: 'Analysis Pending - Reserved for Future AI Model',
    });

    // Need to save again or query to make sure mriId pre-save hook is finished and accessible on object
    const savedMri = await MriReport.findById(mriReport._id);

    await Notification.create({
      userId: patientId,
      userType: 'Patient',
      message: `Dr. ${req.user.name} uploaded a new MRI report: ${req.file.originalname}. Analysis pending.`,
    });

    await logActivity(
      req.user._id,
      'Doctor',
      'MRI Uploaded',
      `Dr. ${req.user.name} uploaded MRI scan "${req.file.originalname}" (${savedMri.mriId || 'MRI-XXXX'}) for Patient ${patient.name} (${patient.patientId})`
    );

    res.status(201).json(savedMri);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Placeholder MRI AI Analysis
// @route   POST /api/mri/analyze
// @access  Public or Private (Exposed empty placeholder)
const analyzeMriPlaceholder = async (req, res) => {
  if (req.user) {
    await logActivity(req.user._id, req.role, 'MRI Analysis Triggered', `MRI AI analysis placeholder triggered`);
  }
  res.json({
    status: 'pending',
    message: 'AI Model will be integrated later.',
  });
};

// @desc    Get MRI Reports for a Patient
// @route   GET /api/mri/patient/:patientId
// @access  Private
const getMrisByPatient = async (req, res) => {
  const { patientId } = req.params;

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.role === 'Doctor' && patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view reports for this patient' });
    }
    if (req.role === 'Patient' && patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these reports' });
    }

    const reports = await MriReport.find({ patientId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadMri,
  analyzeMriPlaceholder,
  getMrisByPatient,
};
