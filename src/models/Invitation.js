const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  hackathonId: {
    type: String,
    required: true,
  },
  teamName: {
    type: String,
    required: true,
  },
  inviterEmail: {
    type: String,
    required: true,
  },
  inviteeEmail: {
    type: String,
    required: true,
  },
  inviteeName: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

// Ensure a user can only have one pending invite for a specific team in a hackathon
invitationSchema.index({ hackathonId: 1, teamName: 1, inviteeEmail: 1 }, { unique: true });

module.exports = mongoose.model('Invitation', invitationSchema);
