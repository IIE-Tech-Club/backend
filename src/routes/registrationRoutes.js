const express = require('express');
const router = express.Router();
const { 
    getRegistrationsByHackathon, 
    getUserRegistration,
    getRegistrationById,
    registerOrUpdate, 
    updateRegistrationStatus,
    deleteRegistration,
    checkAndIncrementUpload,
    evaluateRegistration,
    markRegistration
} = require('../controllers/registrationController');

const { protect } = require('../middleware/authMiddleware');

router.post('/upload-count', protect, checkAndIncrementUpload);
router.post('/evaluate/:id', protect, evaluateRegistration);
router.patch('/:hackathonId/mark/:userId', protect, markRegistration);

router.get('/detail/:id', getRegistrationById);
router.get('/:hackathonId', getRegistrationsByHackathon);
router.get('/:hackathonId/user/:userId', getUserRegistration);
router.post('/', protect, registerOrUpdate);
router.patch('/:id', protect, updateRegistrationStatus);
router.delete('/:id', protect, deleteRegistration);

module.exports = router;
