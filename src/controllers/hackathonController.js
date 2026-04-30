const Hackathon = require('../models/Hackathon');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary for asset cleanup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const extractPublicId = (url) => {
    try {
        // Cloudinary URL format: .../v1234567890/folder/public_id.ext
        const regex = /\/v\d+\/(.+)\.\w+$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
};

// @desc    Get all hackathons
// @route   GET /api/hackathons
const getHackathons = async (req, res) => {
    try {
        const hackathons = await Hackathon.find().sort({ createdAt: -1 });
        res.json(hackathons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single hackathon by ID
// @route   GET /api/hackathons/:id
const getHackathonById = async (req, res) => {
    try {
        const hackathon = await Hackathon.findOne({ id: req.params.id });
        if (!hackathon) {
            return res.status(404).json({ message: 'Hackathon not found' });
        }
        res.json(hackathon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new hackathon
// @route   POST /api/hackathons
const createHackathon = async (req, res) => {
    try {
        const { id, title, tagline, date, startDate, endDate, prize, banner, organizers, slots, contactEmail, phases, creatorId, creatorEmail } = req.body;
        
        const hackathon = await Hackathon.create({
            id,
            title,
            tagline,
            date,
            startDate,
            endDate,
            prize,
            banner,
            organizers,
            slots,
            contactEmail,
            phases,
            creatorId,
            creatorEmail
        });

        res.status(201).json(hackathon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a hackathon
// @route   PATCH /api/hackathons/:id
const updateHackathon = async (req, res) => {
    try {
        const { phases, startDate, endDate, title, tagline, date, prize, slots, creatorId } = req.body;
        
        if (!creatorId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const hackathon = await Hackathon.findOne({ id: req.params.id });
        
        if (!hackathon) {
            return res.status(404).json({ message: 'Hackathon not found' });
        }

        if (hackathon.creatorId !== creatorId) {
            return res.status(403).json({ message: 'Only the creator can modify this hackathon' });
        }

        const updateData = {};
        if (req.body.hasOwnProperty('phases')) updateData.phases = phases;
        if (req.body.hasOwnProperty('startDate')) updateData.startDate = startDate;
        if (req.body.hasOwnProperty('endDate')) updateData.endDate = endDate;
        if (req.body.hasOwnProperty('title')) updateData.title = title;
        if (req.body.hasOwnProperty('tagline')) updateData.tagline = tagline;
        if (req.body.hasOwnProperty('date')) updateData.date = date;
        if (req.body.hasOwnProperty('prize')) updateData.prize = prize;
        if (req.body.hasOwnProperty('slots')) updateData.slots = slots;
        if (req.body.hasOwnProperty('organizers')) updateData.organizers = req.body.organizers;
        if (req.body.hasOwnProperty('contactEmail')) updateData.contactEmail = req.body.contactEmail;
        if (req.body.hasOwnProperty('banner')) updateData.banner = req.body.banner;
        if (req.body.hasOwnProperty('judges')) updateData.judges = req.body.judges;
        if (req.body.hasOwnProperty('judgingParameters')) updateData.judgingParameters = req.body.judgingParameters;

        const updatedHackathon = await Hackathon.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { returnDocument: 'after' }
        );

        res.json(updatedHackathon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a hackathon
const deleteHackathon = async (req, res) => {
    try {
        const { creatorId } = req.query;
        const hackathonId = req.params.id;
        
        if (!creatorId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const hackathon = await Hackathon.findOne({ id: hackathonId });
        
        if (!hackathon) {
            return res.status(404).json({ message: 'Hackathon not found' });
        }

        if (hackathon.creatorId !== creatorId) {
            return res.status(403).json({ message: 'Only the creator can delete this hackathon' });
        }

        // 1. Delete all assets from Cloudinary in the hackathon's specific folder
        try {
            const folderPath = `hackathons/${hackathonId}`;
            
            // Delete all resources in the folder
            await cloudinary.api.delete_resources_by_prefix(`${folderPath}/`);
            
            // Delete subfolders (Cloudinary folders must be empty to be deleted)
            // Note: We ignore errors here in case subfolders don't exist
            const subfolders = ['banners', 'organisers', 'submissions'];
            for (const sub of subfolders) {
                try {
                    await cloudinary.api.delete_folder(`${folderPath}/${sub}`);
                } catch (e) {
                    // Ignore folder not found errors
                }
            }
            
            // Delete the main folder
            try {
                await cloudinary.api.delete_folder(folderPath);
            } catch (e) {
                // Ignore folder not found errors
            }
        } catch (cloudErr) {
            console.error('Cloudinary folder cleanup failed:', cloudErr);
            // We continue even if Cloudinary fails, to ensure DB is cleaned
        }

        // 2. Delete registrations from MongoDB
        const Registration = require('../models/Registration');
        await Registration.deleteMany({ hackathonId });

        // 3. Delete invitations from MongoDB
        const Invitation = require('../models/Invitation');
        await Invitation.deleteMany({ hackathonId });

        // 4. Delete hackathon from MongoDB
        await Hackathon.findOneAndDelete({ id: hackathonId });

        res.json({ message: 'Hackathon and all associated data (including cloud assets) deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload banner to Cloudinary
// @route   POST /api/hackathons/upload-banner
const uploadBanner = async (req, res) => {
    try {
        const { image, hackathonId } = req.body;
        if (!image) {
            return res.status(400).json({ message: 'No image provided' });
        }

        const folder = hackathonId ? `hackathons/${hackathonId}/banners` : 'hackathon_banners';

        const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: folder,
        });

        res.status(200).json({ url: uploadResponse.secure_url });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept judge invitation
// @route   POST /api/hackathons/:id/judges/accept
const acceptJudgeInvitation = async (req, res) => {
    try {
        const { email } = req.body;
        const hackathon = await Hackathon.findOne({ id: req.params.id });
        if (!hackathon) return res.status(404).json({ message: 'Hackathon not found' });

        const judge = hackathon.judges.find(j => j.email === email);
        if (judge) {
            judge.status = 'accepted';
            await hackathon.save();
            res.json({ message: 'Invitation accepted successfully' });
        } else {
            res.status(404).json({ message: 'Judge invitation not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getHackathons,
    getHackathonById,
    createHackathon,
    updateHackathon,
    deleteHackathon,
    uploadBanner,
    acceptJudgeInvitation
};
