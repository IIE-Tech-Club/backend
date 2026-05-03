const User = require('../models/User');
const Registration = require('../models/Registration');
const Invitation = require('../models/Invitation');

// @desc    Get all users
// @route   GET /api/users
// @access  Public
const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Sync user from Firebase to MongoDB
// @route   POST /api/users/sync
// @access  Public
const syncUser = async (req, res) => {
    try {
        const { uid, name, email, photoURL } = req.body;

        // Find user by email or uid
        let user = await User.findOne({ email });

        if (user) {
            // Update existing user
            user.name = name || user.name;
            user.photoURL = photoURL || user.photoURL;
            user.lastLogin = Date.now();
            await user.save();
            return res.json(user);
        }

        // Create new user
        user = await User.create({
            uid,
            name,
            email,
            photoURL,
            role: 'student'
        });

        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user by UID
// @route   GET /api/users/:uid
// @access  Public
const getUserByUid = async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.params.uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile by UID
// @route   PUT /api/users/:uid
// @access  Public
const updateUserByUid = async (req, res) => {
    try {
        const { name, gender, year, branch, collegeName, bio, phone, github, linkedin } = req.body;
        
        let user = await User.findOne({ uid: req.params.uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name || user.name;
        if (gender) user.gender = gender;
        if (year) user.year = year;
        if (branch) user.branch = branch;
        if (collegeName) user.collegeName = collegeName;
        if (bio) user.bio = bio;
        if (phone) user.phone = phone;
        if (github !== undefined) user.github = github;
        if (linkedin !== undefined) user.linkedin = linkedin;

        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user and all associated data
// @route   DELETE /api/users/:uid
// @access  Public
const deleteUserByUid = async (req, res) => {
    try {
        const { uid } = req.params;
        
        // Find the user first to get the email
        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userEmail = user.email;

        // 1. Delete all registrations associated with this user
        await Registration.deleteMany({ userId: uid });

        // 2. Delete all invitations where user is inviter or invitee
        await Invitation.deleteMany({
            $or: [
                { inviterEmail: userEmail },
                { inviteeEmail: userEmail }
            ]
        });

        // 3. Delete the user document itself
        await User.deleteOne({ uid });

        res.json({ 
            message: 'User and all associated registrations and invitations have been purged from the system.' 
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUsers,
    syncUser,
    getUserByUid,
    updateUserByUid,
    deleteUserByUid
};
