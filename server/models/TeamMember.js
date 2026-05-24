const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null, // null until invite is accepted
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'member', 'viewer'],
        default: 'member',
    },
    inviteEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    inviteToken: {
        type: String,
        default: null, // cleared after acceptance
    },
    isAccepted: {
        type: Boolean,
        default: false,
    },
    invitedAt: {
        type: Date,
        default: Date.now,
    },
    acceptedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

teamMemberSchema.index({ orgId: 1 });
teamMemberSchema.index({ userId: 1 });
teamMemberSchema.index({ inviteToken: 1 });
teamMemberSchema.index({ orgId: 1, inviteEmail: 1 }, { unique: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
