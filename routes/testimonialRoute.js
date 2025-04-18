const express = require('express');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { createTestimonial, getAllTestimonials, getTestimonialById, getUserTestimonials, updateTestimonial, deleteTestimonial } = require('../controllers/testimonialController');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/create', isAuthenticated, upload.single('file'), createTestimonial)
router.get('/', getAllTestimonials);
router.get('/:id', getTestimonialById);
router.get('/user/:userId?', getUserTestimonials);
router.put('/edit/:id', isAuthenticated, updateTestimonial);
router.delete('/delete/:id', isAuthenticated, deleteTestimonial)

module.exports = router;