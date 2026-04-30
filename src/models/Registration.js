const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    hackathonId: {
        type: String,
        required: true
    },
    // Dynamic phase responses
    // Key: phase ID, Value: phase specific data (e.g., boolean for content, object for forms/teams)
    responses: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    uploadCounts: {
        type: Map,
        of: Number,
        default: {}
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Done'],
        default: 'Pending'
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    evaluations: [{
        judgeEmail: { type: String, required: true },
        scores: {
            type: Map,
            of: Number,
            default: {}
        },
        feedback: { type: String },
        evaluatedAt: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('Registration', registrationSchema);
