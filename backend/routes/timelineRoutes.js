const express = require('express');
const router = express.Router();
const { getPatientTimeline } = require('../controllers/timelineController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:patientId', protect, getPatientTimeline);

module.exports = router;
