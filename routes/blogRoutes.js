const express = require('express');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog, getBlogsForUser } = require('../controllers/blogController');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/create',isAuthenticated, upload.single('file'), createBlog)
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);
router.get('/search/user/:id', getBlogsForUser);
router.put('/edit/:id',isAuthenticated, updateBlog);
router.delete('/delete/:id',isAuthenticated, deleteBlog)

module.exports = router;