const express = require('express');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { createCategory, updateCategory, deleteCategory, getAllCategories, getCategoryById } = require('../controllers/categoryController');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/create',isAuthenticated, upload.single('file'), createCategory);
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.put('/edit/:id',isAuthenticated, updateCategory);
router.delete('/delete/:id',isAuthenticated, deleteCategory)

module.exports = router;