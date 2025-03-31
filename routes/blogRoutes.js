const express = require('express');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { createBlog, getAllBlogs, getBlogById, getUserBlogs, updateBlog, deleteBlog } = require('../controllers/blogController');
const router = express.Router();

router.post('/create',isAuthenticated, createBlog)
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);
router.get('/user/:userId?', getUserBlogs);
router.put('/edit/:id',isAuthenticated, updateBlog);
router.delete('/delete/:id',isAuthenticated, deleteBlog)

module.exports = router;