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

            // Attach orgId and role from JWT payload
            req.user.orgId = decoded.orgId || req.user.orgId || null;
            req.user.role  = decoded.role  || 'owner';

            // If user has an org, fetch the ownerId for legacy monitor access
            if (req.user.orgId) {
                const Organization = require('../models/Organization');
                const org = await Organization.findById(req.user.orgId);
                if (org) {
                    req.user.orgOwnerId = org.ownerId;
                }
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
