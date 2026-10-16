const express = require('express');
const router = express.Router();
const {
  uploadMri,
  analyzeMriPlaceholder,
  getMrisByPatient,
} = require('../controllers/mriController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protect, restrictTo('Doctor', 'Patient'), upload.single('mri'), uploadMri);
router.post('/analyze', protect, analyzeMriPlaceholder);
router.get('/patient/:patientId', protect, getMrisByPatient);

module.exports = router;
