const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Attach orgId from JWT payload (or fallback to user document)
            req.user.orgId = decoded.orgId || req.user.orgId || null;

            // Bug 4 Fix: Always re-fetch live role from TeamMember so that
            // role changes take effect immediately without waiting for JWT expiry.
            if (req.user.orgId) {
                const TeamMember = require('../models/TeamMember');
                const Organization = require('../models/Organization');

                const member = await TeamMember.findOne({
                    userId: req.user._id,
                    orgId: req.user.orgId,
                    isAccepted: true,
                });

                // Use live DB role; fall back to JWT role only if no TeamMember record found
                req.user.role = member?.role || decoded.role || 'viewer';

                const org = await Organization.findById(req.user.orgId);
                if (org) {
                    req.user.orgOwnerId = org.ownerId;
                }
            } else {
                // No org yet (brand new user) — trust JWT role
                req.user.role = decoded.role || 'owner';
            }

            return next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
