const express = require('express');
const { createUser, getAll, show, update, deleteUser } = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const router = express.Router();

router.post('/create', isAuthenticated, createUser)
router.get('/', getAll);
router.get('/single/:id?',isAuthenticated, show);
router.put('/edit/:id?',isAuthenticated, update);
router.delete('/delete/:id?',isAuthenticated, deleteUser)

module.exports = router;