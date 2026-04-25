const User = require('../models/User');

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

module.exports = {
    getUsers,
    syncUser
};
