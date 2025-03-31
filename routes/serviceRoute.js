const express = require('express');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { createServices, getAllServicess, getServicesById, updateServices, deleteServices } = require('../controllers/serviceController');
const router = express.Router();

router.post('/create', createServices)
router.get('/', getAllServicess);
router.get('/:id?', getServicesById);
router.put('/edit/:id?', updateServices);
router.delete('/delete/:id?', deleteServices)

module.exports = router;