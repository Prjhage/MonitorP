const express = require('express');
const router = express.Router();
const ApiKey = require('../models/ApiKey');
const { protect } = require('../middleware/auth');
const { scanGitHub } = require('../engine/githubScanner');

// @desc    Get all API keys for logged in user
// @route   GET /api/api-keys
router.get('/', protect, async (req, res) => {
    try {
        const keys = await ApiKey.find({ userId: req.user._id }).sort({ expiryDate: 1 });
        res.json(keys);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new API key entry
// @route   POST /api/api-keys
router.post('/', protect, async (req, res) => {
    const { serviceName, keyType, keyPreview, expiryDate, environment, alertEmail, notes, githubScanningEnabled } = req.body;

    try {
        const key = await ApiKey.create({
            userId: req.user._id,
            serviceName,
            keyType,
            keyPreview,
            expiryDate,
            environment,
            alertEmail: alertEmail || req.user.email,
            notes,
            githubScanningEnabled
        });
        res.status(201).json(key);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update API key entry
// @route   PATCH /api/api-keys/:id
router.patch('/:id', protect, async (req, res) => {
    try {
        const key = await ApiKey.findById(req.params.id);
        if (!key || key.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'API Key not found' });
        }

        const allowedFields = ['serviceName', 'keyType', 'keyPreview', 'expiryDate', 'environment', 'alertEmail', 'notes', 'githubScanningEnabled'];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                key[field] = req.body[field];
            }
        }

        await key.save();
        res.json(key);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete API key entry
// @route   DELETE /api/api-keys/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const key = await ApiKey.findById(req.params.id);
        if (!key || key.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'API Key not found' });
        }

        await key.deleteOne();
        res.json({ message: 'API Key entry removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Trigger a GitHub exposure scan manually
// @route   POST /api/api-keys/scan/:id
router.post('/scan/:id', protect, async (req, res) => {
    try {
        const key = await ApiKey.findById(req.params.id);
        if (!key || key.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'API Key not found' });
        }

        const result = await scanGitHub(key._id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
