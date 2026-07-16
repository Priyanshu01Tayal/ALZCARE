const express = require('express');
const router = express.Router();
const { registerDoctor, registerAdmin, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register/doctor', registerDoctor);
router.post('/register/admin', registerAdmin);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;

