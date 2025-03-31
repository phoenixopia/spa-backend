const express = require('express');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { createTestimonial, getAllTestimonials, getTestimonialById, getUserTestimonials, updateTestimonial, deleteTestimonial } = require('../controllers/testimonialController');
const router = express.Router();

router.post('/create', isAuthenticated, createTestimonial)
router.get('/', getAllTestimonials);
router.get('/:id', getTestimonialById);
router.get('/user/:userId?', getUserTestimonials);
router.put('/edit/:id', isAuthenticated, updateTestimonial);
router.delete('/delete/:id', isAuthenticated, deleteTestimonial)

module.exports = router;