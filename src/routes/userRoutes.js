const express = require('express');
const router = express.Router();
const { getUsers, syncUser } = require('../controllers/userController');

router.get('/', getUsers);
router.post('/sync', syncUser);

module.exports = router;
