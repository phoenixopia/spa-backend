const express = require('express');
const { createUser, getAll, show, update, deleteUser } = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/create', createUser)
router.get('/', getAll);
router.get('/:id?', show);
router.put('/edit/:id?', update);
router.delete('/delete/:id?', deleteUser)

module.exports = router;