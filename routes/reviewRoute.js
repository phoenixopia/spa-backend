const express = require('express');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { createReview, getAllReview, getReviewById, updateReview, deleteReview } = require('../controllers/reviewController');
const router = express.Router();

router.post('/create', createReview)
router.get('/', getAllReview);
router.get('/:id', getReviewById);
router.put('/edit/:id',isAuthenticated, updateReview);
router.delete('/delete/:id',isAuthenticated, deleteReview)

module.exports = router;