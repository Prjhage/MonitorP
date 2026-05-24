const express = require('express');
const router = express.Router();
const ApiKey = require('../models/ApiKey');
const { protect } = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { getOrgFilter, getOrgFields, canModify } = require('../utils/orgFilter');
const { logAudit } = require('../utils/auditLogger');

// @desc    Get all API keys for the org
// @route   GET /api/api-keys
router.get('/', protect, requireMinRole('viewer'), async (req, res) => {
    try {
        const keys = await ApiKey.find(getOrgFilter(req)).sort({ expiryDate: 1 });
        res.json(keys);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new API key entry
// @route   POST /api/api-keys
router.post('/', protect, requireMinRole('admin'), async (req, res) => {
    const { serviceName, keyType, keyPreview, expiryDate, environment, alertEmail, notes } = req.body;
    try {
        const key = await ApiKey.create({
            ...getOrgFields(req),
            serviceName,
            keyType,
            keyPreview,
            expiryDate,
            environment,
            alertEmail: alertEmail || req.user.email,
            notes,
        });
        await logAudit(req, 'created', 'apikey', key._id, `${serviceName} (${environment})`);
        res.status(201).json(key);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update API key entry
// @route   PATCH /api/api-keys/:id
router.patch('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const key = await ApiKey.findById(req.params.id);
        if (!key || !canModify(key, req)) return res.status(404).json({ message: 'API Key not found' });

        const allowedFields = ['serviceName', 'keyType', 'keyPreview', 'expiryDate', 'environment', 'alertEmail', 'notes'];
        const changes = [];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined && String(key[field]) !== String(req.body[field])) {
                changes.push({ field, oldValue: key[field], newValue: req.body[field] });
                key[field] = req.body[field];
            }
        }
        await key.save();
        await logAudit(req, 'updated', 'apikey', key._id, key.serviceName, changes);
        res.json(key);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete API key entry
// @route   DELETE /api/api-keys/:id
router.delete('/:id', protect, requireMinRole('admin'), async (req, res) => {
    try {
        const key = await ApiKey.findById(req.params.id);
        if (!key || !canModify(key, req)) return res.status(404).json({ message: 'API Key not found' });
        await key.deleteOne();
        await logAudit(req, 'deleted', 'apikey', key._id, key.serviceName);
        res.json({ message: 'API Key entry removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
