/**
 * rbac.js — Role-Based Access Control middleware
 *
 * Role hierarchy:
 *   owner > admin > member > viewer
 *
 * Usage:
 *   router.post('/', protect, requireRole(['owner', 'admin']), handler);
 */

const ROLE_HIERARCHY = {
    owner:  4,
    admin:  3,
    member: 2,
    viewer: 1,
};

/**
 * requireRole(allowedRoles)
 * Blocks the request with 403 if the user's role is not in the allowed list.
 *
 * @param {string[]} allowedRoles — e.g. ['owner', 'admin']
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role || 'viewer';

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}.`,
            });
        }

        next();
    };
};

/**
 * requireMinRole(minRole)
 * Blocks the request if the user's role is below the minimum level.
 * e.g. requireMinRole('member') allows member, admin, owner but blocks viewer
 */
const requireMinRole = (minRole) => {
    return (req, res, next) => {
        const userRole = req.user?.role || 'viewer';
        const userLevel = ROLE_HIERARCHY[userRole] || 0;
        const minLevel  = ROLE_HIERARCHY[minRole]  || 0;

        if (userLevel < minLevel) {
            return res.status(403).json({
                message: `Access denied. Minimum required role: ${minRole}. Your role: ${userRole}.`,
            });
        }

        next();
    };
};

module.exports = { requireRole, requireMinRole };
