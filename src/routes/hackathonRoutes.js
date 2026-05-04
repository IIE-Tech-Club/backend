const express = require('express');
const router = express.Router();
const { getHackathons, getHackathonById, createHackathon, updateHackathon, deleteHackathon, uploadBanner, acceptJudgeInvitation } = require('../controllers/hackathonController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', getHackathons);
router.get('/:id', getHackathonById);
router.post('/', protect, createHackathon);
router.post('/upload-banner', protect, uploadBanner);
router.post('/:id/judges/accept', protect, acceptJudgeInvitation);
router.patch('/:id', protect, updateHackathon);
router.delete('/:id', protect, deleteHackathon);

module.exports = router;
