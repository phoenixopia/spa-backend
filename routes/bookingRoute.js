const express = require('express');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { createBooking, getAllBookings, getBookingById, updateBooking, deleteBooking, getBookingsByPhone, getTodayBookings } = require('../controllers/bookingController');
const router = express.Router();


router.get('/', getAllBookings);
router.get('/today', getTodayBookings);
router.get('/:id?', getBookingById);
router.get('/search/phone', getBookingsByPhone);
router.post('/create', createBooking)
router.put('/edit/:id?', updateBooking);
router.delete('/delete/:id?',isAuthenticated, deleteBooking)

module.exports = router;