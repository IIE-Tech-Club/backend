const mongoose = require('mongoose');

const hackathonSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    tagline: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    prize: {
        type: String
    },
    banner: {
        type: String,
        default: 'linear-gradient(135deg, #020617 0%, #0a1628 50%, #001a1a 100%)'
    },
    organizers: [{
        name: { type: String, required: true },
        phone: { type: String },
        email: { type: String },
        avatar: { type: String },
        socials: {
            twitter: String,
            linkedin: String,
            github: String
        }
    }],
    slots: {
        type: Number
    },
    contactEmail: {
        type: String
    },
    status: {
        type: String,
        enum: ['Upcoming', 'Live', 'Completed'],
        default: 'Upcoming'
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    phases: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        isMandatory: { type: Boolean, default: false },
        startDate: { type: Date },
        endDate: { type: Date },
        fields: [{
            id: { type: String, required: true },
            label: { type: String, required: true },
            type: { type: String, enum: ['text', 'email', 'tel', 'url', 'textarea', 'select', 'checkbox', 'radio', 'number', 'date', 'file', 'content'], required: true },
            required: { type: Boolean, default: true },
            options: [String]
        }]
    }],
    judges: [{
        email: { type: String, required: true },
        status: { type: String, enum: ['invited', 'accepted'], default: 'invited' },
        name: { type: String },
        avatar: { type: String }
    }],
    judgingParameters: [{
        name: { type: String, required: true },
        maxScore: { type: Number, default: 10 }
    }],
    creatorId: {
        type: String,
        required: true
    },
    creatorEmail: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Hackathon', hackathonSchema);
