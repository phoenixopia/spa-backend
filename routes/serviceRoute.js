const express = require('express');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { createService, getServiceById, updateService, deleteService, getAllServices, getServiceForCategory } = require('../controllers/serviceController');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/create',isAuthenticated,upload.single('file'), createService)
router.get('/', getAllServices);
router.get('/:id', getServiceById);
router.get('/search/category/:id', getServiceForCategory);
router.put('/edit/:id',isAuthenticated, updateService);
router.delete('/delete/:id',isAuthenticated, deleteService)

module.exports = router;