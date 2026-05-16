const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

// Admin Login
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Authentication successful',
            admin: { email: admin.email }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
