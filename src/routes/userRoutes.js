const express = require('express');
const router = express.Router();
const { getUsers, syncUser, getUserByUid, updateUserByUid, deleteUserByUid } = require('../controllers/userController');

router.get('/', getUsers);
router.post('/sync', syncUser);
router.get('/:uid', getUserByUid);
router.put('/:uid', updateUserByUid);
router.delete('/:uid', deleteUserByUid);

module.exports = router;
