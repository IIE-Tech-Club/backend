const express = require('express');
const router = express.Router();
const { 
    getRegistrationsByHackathon, 
    getUserRegistration,
    getRegistrationById,
    registerOrUpdate, 
    updateRegistrationStatus,
    deleteRegistration,
    checkAndIncrementUpload
} = require('../controllers/registrationController');

router.post('/upload-count', checkAndIncrementUpload);

router.get('/detail/:id', getRegistrationById);
router.get('/:hackathonId', getRegistrationsByHackathon);
router.get('/:hackathonId/user/:userId', getUserRegistration);
router.post('/', registerOrUpdate);
router.patch('/:id', updateRegistrationStatus);
router.delete('/:id', deleteRegistration);

module.exports = router;
