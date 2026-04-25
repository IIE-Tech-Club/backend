const express = require('express');
const router = express.Router();
const { getHackathons, getHackathonById, createHackathon, updateHackathon, deleteHackathon, uploadBanner } = require('../controllers/hackathonController');

router.get('/', getHackathons);
router.get('/:id', getHackathonById);
router.post('/', createHackathon);
router.post('/upload-banner', uploadBanner);
router.patch('/:id', updateHackathon);
router.delete('/:id', deleteHackathon);

module.exports = router;
