const Invitation = require('../models/Invitation');
const User = require('../models/User');

exports.createInvitation = async (req, res) => {
  try {
    const { hackathonId, teamName, inviterEmail, inviteeEmail } = req.body;

    if (!hackathonId || !teamName || !inviterEmail || !inviteeEmail) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if invitation already exists
    let invitation = await Invitation.findOne({
      hackathonId,
      teamName,
      inviteeEmail
    });

    if (invitation) {
        // Check cooldown (e.g., 2 minutes) to prevent spamming
        const COOLDOWN_MS = 2 * 60 * 1000;
        const now = new Date();
        const lastUpdated = new Date(invitation.updatedAt);
        
        if (now - lastUpdated < COOLDOWN_MS) {
            const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastUpdated)) / 1000);
            return res.status(429).json({ 
                message: `Tactical delay active. Please wait ${remainingSeconds} seconds before resynchronizing this invitation.`,
                remainingSeconds 
            });
        }

        if (invitation.status === 'rejected' || invitation.status === 'pending') {
            invitation.status = 'pending';
            invitation.inviterEmail = inviterEmail; // Update inviter in case a different member is resending
            await invitation.save();
            return res.status(200).json({ message: 'Invitation resent', invitation });
        }
        
        return res.status(400).json({ message: 'Invitation already active or accepted', invitation });
    }

    invitation = new Invitation({
      hackathonId,
      teamName,
      inviterEmail,
      inviteeEmail
    });

    await invitation.save();
    res.status(201).json({ message: 'Invitation sent successfully', invitation });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Invitation already sent' });
    }
    console.error('Error creating invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserInvitations = async (req, res) => {
  try {
    const { email } = req.params;
    const invitations = await Invitation.find({ inviteeEmail: email, status: 'pending' });
    res.status(200).json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findById(id);
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });
    
    invitation.status = 'accepted';
    
    // Look up user to store their name
    const user = await User.findOne({ email: invitation.inviteeEmail });
    if (user) {
      invitation.inviteeName = user.name;
    }
    
    await invitation.save();
    res.status(200).json({ message: 'Invitation accepted', invitation });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findById(id);
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });
    
    invitation.status = 'rejected';
    await invitation.save();
    res.status(200).json({ message: 'Invitation rejected', invitation });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getInvitationStatus = async (req, res) => {
  try {
    const { hackathonId, teamName, email } = req.params;
    const invitation = await Invitation.findOne({
      hackathonId,
      teamName,
      inviteeEmail: email
    });
    
    if (!invitation) return res.status(200).json({ message: 'Invitation not found', status: 'none' });
    
    res.status(200).json({ status: invitation.status, invitation });
  } catch (error) {
    console.error('Error fetching invitation status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getTeamInvitations = async (req, res) => {
  try {
    const { hackathonId, teamName } = req.params;
    const invitations = await Invitation.find({
      hackathonId,
      teamName
    });
    res.status(200).json(invitations);
  } catch (error) {
    console.error('Error fetching team invitations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAcceptedInvitation = async (req, res) => {
  try {
    const { hackathonId, email } = req.params;
    const invitation = await Invitation.findOne({
      hackathonId,
      inviteeEmail: email,
      status: 'accepted'
    });
    
    if (!invitation) return res.status(200).json({ found: false });
    res.status(200).json({ found: true, invitation });
  } catch (error) {
    console.error('Error fetching accepted invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
