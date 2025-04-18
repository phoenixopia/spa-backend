const express = require('express');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { getAllNotifications, getNotificationById, updateNotificationStatus, getNotificationForUser } = require('../controllers/notificationController');
const router = express.Router();


router.get('/', getAllNotifications);
router.get('/:id', getNotificationById);
router.get('/search/user/:id', getNotificationForUser);
router.put('/edit/:id',isAuthenticated, isAdmin, updateNotificationStatus);

module.exports = router;