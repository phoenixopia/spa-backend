const express = require('express');
const { signup, confirm, signin, logout, forgot, reset } = require('../controllers/authController');
const router = express.Router();

// authentication
router.post('/signup', signup);
router.post('/confirm/:confirmationCode?', confirm)
router.post('/signin', signin);
router.post('/logout', logout);
router.post('/forgot', forgot);
router.post('/reset/:resetCode?', reset);

module.exports = router;