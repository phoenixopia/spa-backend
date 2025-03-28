const express = require('express');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { createBooking, getAllBookings, getBookingById, updateBooking, deleteBooking } = require('../controllers/bookingController');
// const { createServices, getAllServicess, getServicesById, updateServices, deleteServices } = require('../controllers/serviceController');
const router = express.Router();

router.get('/create', createBooking)
router.get('/', getAllBookings);
router.get('/:id?', getBookingById);
router.put('/edit/:id?', updateBooking);
router.delete('/delete/:id?', deleteBooking)

module.exports = router;