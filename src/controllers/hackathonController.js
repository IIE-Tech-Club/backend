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
// @route   DELETE /api/hackathons/:id
const deleteHackathon = async (req, res) => {
    try {
        const { creatorId } = req.query;
        
        if (!creatorId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const hackathon = await Hackathon.findOne({ id: req.params.id });
        
        if (!hackathon) {
            return res.status(404).json({ message: 'Hackathon not found' });
        }

        if (hackathon.creatorId !== creatorId) {
            return res.status(403).json({ message: 'Only the creator can delete this hackathon' });
        }

        const Registration = require('../models/Registration');
        const registrations = await Registration.find({ hackathonId: req.params.id });
        
        // 1. Identify and delete Cloudinary assets
        const publicIds = [];
        registrations.forEach(reg => {
            if (reg.responses) {
                // Responses is a Map in the model
                reg.responses.forEach((phaseData) => {
                    if (typeof phaseData === 'string' && phaseData.includes('res.cloudinary.com')) {
                        const pid = extractPublicId(phaseData);
                        if (pid) publicIds.push(pid);
                    } else if (typeof phaseData === 'object' && phaseData !== null) {
                        Object.values(phaseData).forEach(val => {
                            if (typeof val === 'string' && val.includes('res.cloudinary.com')) {
                                const pid = extractPublicId(val);
                                if (pid) publicIds.push(pid);
                            }
                        });
                    }
                });
            }
        });

        if (publicIds.length > 0) {
            try {
                // Delete assets from Cloudinary
                await cloudinary.api.delete_resources(publicIds);
            } catch (cloudErr) {
                console.error('Cloudinary asset cleanup failed:', cloudErr);
                // We continue even if Cloudinary fails, to ensure DB is cleaned
            }
        }

        // 2. Delete registrations from MongoDB
        await Registration.deleteMany({ hackathonId: req.params.id });

        // 3. Delete hackathon from MongoDB
        await Hackathon.findOneAndDelete({ id: req.params.id });

        res.json({ message: 'Hackathon and all associated data (including cloud assets) deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload banner to Cloudinary
// @route   POST /api/hackathons/upload-banner
const uploadBanner = async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ message: 'No image provided' });
        }

        const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: 'hackathon_banners',
        });

        res.status(200).json({ url: uploadResponse.secure_url });
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
    uploadBanner
};
