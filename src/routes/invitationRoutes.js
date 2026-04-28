const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

router.post('/', invitationController.createInvitation);
router.get('/user/:email', invitationController.getUserInvitations);
router.put('/:id/accept', invitationController.acceptInvitation);
router.put('/:id/reject', invitationController.rejectInvitation);
router.get('/status/:hackathonId/:teamName/:email', invitationController.getInvitationStatus);
router.get('/team/:hackathonId/:teamName', invitationController.getTeamInvitations);
router.get('/accepted/:hackathonId/:email', invitationController.getAcceptedInvitation);

module.exports = router;
