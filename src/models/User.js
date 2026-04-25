const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    photoURL: {
        type: String
    },
    role: {
        type: String,
        enum: ['student', 'admin', 'organizer'],
        default: 'student'
    },
    team: {
        type: String,
        default: 'Individual'
    },
    track: {
        type: String,
        default: 'General'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
