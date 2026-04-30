const Registration = require('../models/Registration');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary for asset cleanup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const extractPublicId = (url) => {
    try {
        // Handle both /image/upload and /raw/upload
        // Format: .../upload/v1234567890/folder/public_id.ext
        const regex = /\/upload\/v\d+\/(.+)\.\w+$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
};

// @desc    Get all registrations for a specific hackathon
// @route   GET /api/registrations/:hackathonId
const getRegistrationsByHackathon = async (req, res) => {
    try {
        const { hackathonId } = req.params;
        const registrations = await Registration.find({ hackathonId });
        
        // Populate user details for each registration
        const populatedData = await Promise.all(registrations.map(async (reg) => {
            const user = await User.findOne({ uid: reg.userId });
            const regObj = reg.toObject({ flattenMaps: true });
            return {
                ...regObj,
                user: user || { name: 'Unknown', email: 'N/A' }
            };
        }));

        res.json(populatedData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single registration by Mongo ID
// @route   GET /api/registrations/detail/:id
const getRegistrationById = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id);
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }
        
        const user = await User.findOne({ uid: registration.userId });
        const regObj = registration.toObject({ flattenMaps: true });
        res.json({
            ...regObj,
            user: user || { name: 'Unknown', email: 'N/A' }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get registration for a specific user and hackathon
// @route   GET /api/registrations/:hackathonId/user/:userId
const getUserRegistration = async (req, res) => {
    try {
        const { hackathonId, userId } = req.params;
        const registration = await Registration.findOne({ hackathonId, userId });
        if (registration) {
            res.json(registration.toObject({ flattenMaps: true }));
        } else {
            res.json(null);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Increment and check upload limit for a field
// @route   POST /api/registrations/upload-count
const checkAndIncrementUpload = async (req, res) => {
    try {
        const { userId, hackathonId, phaseId, fieldId } = req.body;
        const registration = await Registration.findOne({ userId, hackathonId });
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        const countKey = `${phaseId}_${fieldId}`;
        const currentCount = registration.uploadCounts ? (registration.uploadCounts.get(countKey) || 0) : 0;

        if (currentCount >= 3) {
            return res.status(403).json({ 
                message: 'Limit reached. Only 3 uploads permitted per artifact.',
                count: currentCount 
            });
        }

        if (!registration.uploadCounts) registration.uploadCounts = new Map();
        registration.uploadCounts.set(countKey, currentCount + 1);
        await registration.save();

        // Sync with other team members
        const formationResp = registration.responses.get('phase_2_team_formation');
        if (formationResp && formationResp.teamName) {
            const teamName = formationResp.teamName;
            const otherMembers = await Registration.find({
                hackathonId,
                userId: { $ne: userId },
                [`responses.phase_2_team_formation.teamName`]: teamName
            });

            if (otherMembers.length > 0) {
                await Promise.all(otherMembers.map(async (memberReg) => {
                    if (!memberReg.uploadCounts) memberReg.uploadCounts = new Map();
                    memberReg.uploadCounts.set(countKey, currentCount + 1);
                    return memberReg.save();
                }));
            }
        }

        res.json({ count: currentCount + 1, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register or update registration for a hackathon
// @route   POST /api/registrations
const registerOrUpdate = async (req, res) => {
    try {
        const { userId, hackathonId, phase, data } = req.body;

        let registration = await Registration.findOne({ userId, hackathonId });

        if (!registration) {
            registration = new Registration({ userId, hackathonId });
        }

        if (!registration.responses) {
            registration.responses = new Map();
        }

        // Check for team name uniqueness if provided in data
        if (data && data.teamName) {
            const teamNameNormalized = data.teamName.trim();
            if (teamNameNormalized) {
                // First, check if the user has an accepted invitation for this team
                const user = await User.findOne({ uid: userId });
                let isAuthorizedMember = false;
                
                if (user) {
                    const Invitation = require('../models/Invitation');
                    const invite = await Invitation.findOne({
                        hackathonId,
                        teamName: { $regex: new RegExp(`^${teamNameNormalized}$`, 'i') },
                        inviteeEmail: user.email,
                        status: 'accepted'
                    });
                    if (invite) {
                        isAuthorizedMember = true;
                    }
                }

                if (!isAuthorizedMember) {
                    const allRegistrations = await Registration.find({ hackathonId, userId: { $ne: userId } });
                    const isNameTaken = allRegistrations.some(reg => {
                        const responses = reg.responses;
                        for (const [pId, pData] of responses) {
                            if (pData && pData.teamName && pData.teamName.trim().toLowerCase() === teamNameNormalized.toLowerCase()) {
                                return true;
                            }
                        }
                        return false;
                    });

                    if (isNameTaken) {
                        return res.status(400).json({ message: `The team name "${teamNameNormalized}" is already claimed by another squadron. Choose a unique designation.` });
                    }
                }
            }
        }

        registration.responses.set(phase, data);
        
        // If this is the registration phase, mark as Done
        if (phase === 'phase_1_registration') {
            registration.status = 'Done';
        }

        await registration.save();

        // TEAM SYNCHRONIZATION LOGIC
        // If this is a team-related phase (Formation or Submission), sync with other members
        const teamPhases = ['phase_2_team_formation', 'phase_3_submissions'];
        if (teamPhases.includes(phase)) {
            let teamName = '';
            if (phase === 'phase_2_team_formation') {
                teamName = data.teamName;
            } else {
                // For later phases, get team name from the formation phase response
                const formationResp = registration.responses.get('phase_2_team_formation');
                if (formationResp) teamName = formationResp.teamName;
            }

            if (teamName) {
                // Find all other registrations in this hackathon with the same team name
                // We search through the responses map in MongoDB
                const query = {
                    hackathonId,
                    userId: { $ne: userId }, // Don't update the current user again
                    [`responses.phase_2_team_formation.teamName`]: teamName
                };

                const otherMembers = await Registration.find(query);
                
                if (otherMembers.length > 0) {
                    await Promise.all(otherMembers.map(async (memberReg) => {
                        memberReg.responses.set(phase, data);
                        return memberReg.save();
                    }));
                }
            }
        }

        res.json(registration);
    } catch (error) {
        console.error('Error in registerOrUpdate:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update registration status
// @route   PATCH /api/registrations/:id
const updateRegistrationStatus = async (req, res) => {
    try {
        const { status, creatorId } = req.body;
        
        if (!creatorId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const registration = await Registration.findById(req.params.id);
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        const Hackathon = require('../models/Hackathon');
        const hackathon = await Hackathon.findOne({ id: registration.hackathonId });
        
        if (!hackathon || hackathon.creatorId !== creatorId) {
            return res.status(403).json({ message: 'Only the creator can modify registration status' });
        }

        registration.status = status;
        await registration.save();

        res.json(registration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a registration
// @route   DELETE /api/registrations/:id
const deleteRegistration = async (req, res) => {
    try {
        const { creatorId } = req.query;
        
        if (!creatorId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const registration = await Registration.findById(req.params.id);
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        const Hackathon = require('../models/Hackathon');
        const hackathon = await Hackathon.findOne({ id: registration.hackathonId });
        
        if (!hackathon || hackathon.creatorId !== creatorId) {
            return res.status(403).json({ message: 'Only the creator can delete registrations' });
        }

        // 1. Check if this squadron should be dissolved (last member)
        let teamName = '';
        const formationResp = registration.responses?.get('phase_2_team_formation');
        if (formationResp) teamName = formationResp.teamName;

        let shouldCleanupAssets = true;
        if (teamName) {
            const otherMembers = await Registration.find({
                hackathonId: registration.hackathonId,
                userId: { $ne: registration.userId },
                [`responses.phase_2_team_formation.teamName`]: teamName
            });
            if (otherMembers.length > 0) {
                shouldCleanupAssets = false; // Team still has members, keep assets
            }
        }

        // 2. Perform Artifact Purge if Dissolved
        if (shouldCleanupAssets && registration.responses) {
            const urlsToDelete = [];
            for (const [phaseId, data] of registration.responses) {
                if (data && typeof data === 'object') {
                    for (const key in data) {
                        const val = data[key];
                        if (typeof val === 'string' && val.includes('cloudinary.com')) {
                            urlsToDelete.push(val);
                        }
                    }
                }
            }

            if (urlsToDelete.length > 0) {
                console.log(`[Dissolve] Purging ${urlsToDelete.length} artifacts from Cloudinary for team: ${teamName || 'Solo'}`);
                await Promise.all(urlsToDelete.map(async (url) => {
                    const publicId = extractPublicId(url);
                    if (publicId) {
                        const resourceType = url.includes('/raw/upload') ? 'raw' : 'image';
                        try {
                            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
                        } catch (err) {
                            console.error(`[Purge_Error] Failed to delete ${publicId}:`, err.message);
                        }
                    }
                }));
            }
        }

        // 3. Purge the manifest entry
        await Registration.findByIdAndDelete(req.params.id);

        res.json({ 
            message: shouldCleanupAssets 
                ? 'Squadron dissolved. Participant and all Cloudinary artifacts have been purged from the manifest.'
                : 'Participant removed. Team artifacts preserved for remaining squad members.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Evaluate a registration (for judges)
// @route   POST /api/registrations/evaluate/:id
const evaluateRegistration = async (req, res) => {
    try {
        const { judgeEmail, scores, feedback } = req.body;
        const registration = await Registration.findById(req.params.id);
        
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        if (!registration.evaluations) {
            registration.evaluations = [];
        }

        // Check if judge already evaluated
        const existingIndex = registration.evaluations.findIndex(e => e.judgeEmail === judgeEmail);
        if (existingIndex > -1) {
            registration.evaluations[existingIndex].scores = scores;
            registration.evaluations[existingIndex].feedback = feedback;
            registration.evaluations[existingIndex].evaluatedAt = Date.now();
        } else {
            registration.evaluations.push({ judgeEmail, scores, feedback });
        }

        await registration.save();
        res.json(registration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRegistrationsByHackathon,
    getUserRegistration,
    getRegistrationById,
    registerOrUpdate,
    updateRegistrationStatus,
    deleteRegistration,
    checkAndIncrementUpload,
    evaluateRegistration
};
