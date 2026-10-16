const fs = require('fs');
const path = require('path');
const MriReport = require('../models/MriReport');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const logActivity = require('../utils/activityLogger');

// Helper function to call Python ML service
const runMriAnalysis = async (mriReport, originalFileName) => {
 const mlServiceUrl = process.env.ML_SERVICE_URL;

  try {
    const absoluteFilePath = path.join(__dirname, '..', mriReport.filePath);
    if (!fs.existsSync(absoluteFilePath)) {
      throw new Error(`File not found at path: ${absoluteFilePath}`);
    }

    const fileBuffer = fs.readFileSync(absoluteFilePath);
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('file', blob, originalFileName || mriReport.fileName);

    const response = await fetch(mlServiceUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ML service returned status ${response.status}: ${errorText}`);
    }

    const mlResult = await response.json(); // { prediction: '...', confidence: 97.82 }

    mriReport.status = 'Completed';
    mriReport.result = `${mlResult.prediction} (${mlResult.confidence.toFixed(2)}% confidence)`;
    await mriReport.save();

    return mlResult;
  } catch (error) {
    console.error('Error running MRI AI analysis:', error.message);
    mriReport.status = 'Error';
    mriReport.result = `Analysis failed: ${error.message}`;
    await mriReport.save();
    throw error;
  }
};

// @desc    Upload MRI Report (Doctor or Patient)
// @route   POST /api/mri/upload
// @access  Private/Doctor or Patient
const uploadMri = async (req, res) => {
  let patientId = req.body.patientId;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an MRI file' });
    }

    if (req.role === 'Patient') {
      patientId = req.user._id;
    }

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.role === 'Doctor' && patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Patient is not assigned to you' });
    }

    if (req.role === 'Patient' && patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload MRI for this patient' });
    }

    const mriReport = await MriReport.create({
      patientId,
      doctorId: patient.doctorId,
      filePath: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      status: 'Pending',
      result: 'Analysis Pending - AI Processing...',
    });

    // Fetch the saved MRI to ensure fields from pre-save hooks are ready
    const savedMri = await MriReport.findById(mriReport._id);

    // Call ML service
    let mlError = null;
    try {
      await runMriAnalysis(savedMri, req.file.originalname);
    } catch (err) {
      mlError = err.message;
    }

    // Refresh report details from DB
    const finalMriReport = await MriReport.findById(mriReport._id);

    if (req.role === 'Doctor') {
      await Notification.create({
        userId: patientId,
        userType: 'Patient',
        message: `Dr. ${req.user.name} uploaded a new MRI report: ${req.file.originalname}. Analysis: ${finalMriReport.result}`,
      });

      await logActivity(
        req.user._id,
        'Doctor',
        'MRI Uploaded',
        `Dr. ${req.user.name} uploaded MRI scan "${req.file.originalname}" (${finalMriReport.mriId || 'MRI-XXXX'}) for Patient ${patient.name}. Classification: ${finalMriReport.result}`
      );
    } else {
      await Notification.create({
        userId: patient.doctorId,
        userType: 'Doctor',
        message: `Patient ${req.user.name} uploaded a new MRI scan: ${req.file.originalname}. AI Prediction: ${finalMriReport.result}`,
      });

      await logActivity(
        req.user._id,
        'Patient',
        'MRI Uploaded',
        `Patient ${req.user.name} uploaded MRI scan "${req.file.originalname}" (${finalMriReport.mriId || 'MRI-XXXX'}). AI Classification: ${finalMriReport.result}`
      );
    }

    res.status(201).json(finalMriReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Placeholder/Real MRI AI Analysis
// @route   POST /api/mri/analyze
// @access  Private (Doctor or Patient)
const analyzeMriPlaceholder = async (req, res) => {
  const { reportId, patientId } = req.body;

  try {
    let report = null;

    if (reportId) {
      report = await MriReport.findById(reportId);
    } else if (patientId) {
      report = await MriReport.findOne({ patientId }).sort({ createdAt: -1 });
    } else {
      // Find latest pending or any latest report for current user context
      if (req.role === 'Patient') {
        report = await MriReport.findOne({ patientId: req.user._id }).sort({ createdAt: -1 });
      } else {
        // Doctor: find latest report uploaded by this doctor
        report = await MriReport.findOne({ doctorId: req.user._id }).sort({ createdAt: -1 });
      }
    }

    if (!report) {
      return res.status(404).json({ message: 'No MRI report found to analyze.' });
    }

    // Perform analysis
    const mlResult = await runMriAnalysis(report);

    if (req.user) {
      await logActivity(
        req.user._id,
        req.role,
        'MRI Analysis Triggered',
        `MRI AI analysis triggered for report ${report.mriId || report._id}. Result: ${report.result}`
      );
    }

    res.json({
      status: 'success',
      prediction: mlResult.prediction,
      confidence: mlResult.confidence,
      report,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
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

