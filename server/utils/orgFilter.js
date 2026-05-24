/**
 * orgFilter.js
 * Returns the right MongoDB query filter for listing monitors.
 * - If user belongs to an org → filter by orgId (shows all team monitors)
 * - Otherwise → filter by userId (legacy / solo users)
 */
const getOrgFilter = (req) => {
    if (req.user.orgId) {
        return { 
            $or: [
                { orgId: req.user.orgId },
                // Legacy: monitors belonging to any team member (primarily the owner) that aren't tagged with orgId yet
                { userId: req.user._id, orgId: { $exists: false } },
                { userId: req.user.orgOwnerId, orgId: { $exists: false } }
            ]
        };
    }
    return { userId: req.user._id };
};

/**
 * getOrgFields — fields to set on a newly created monitor document.
 * Always sets userId. Sets orgId if the user belongs to an org.
 */
const getOrgFields = (req) => {
    const fields = { userId: req.user._id };
    if (req.user.orgId) {
        fields.orgId = req.user.orgId;
    }
    return fields;
};

/**
 * canModify — verify a document belongs to the user's org (or their userId if no org).
 * Returns true if allowed, false if not.
 */
const canModify = (doc, req) => {
    // If the document has an orgId, check if it matches the user's org
    if (doc.orgId && req.user.orgId) {
        return doc.orgId.toString() === req.user.orgId.toString();
    }
    // Fallback: legacy userId check
    if (doc.userId) {
        const userIdStr = doc.userId.toString();
        return (
            userIdStr === req.user._id.toString() || 
            (req.user.orgOwnerId && userIdStr === req.user.orgOwnerId.toString())
        );
    }
    return false;
};

module.exports = { getOrgFilter, getOrgFields, canModify };
