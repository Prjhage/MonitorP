const express = require('express');
const router = express.Router();
const Heartbeat = require('../models/Heartbeat');
const HeartbeatPing = require('../models/HeartbeatPing');
const HeartbeatIncident = require('../models/HeartbeatIncident');
const { protect } = require('../middleware/auth');
const { generateSlug } = require('../utils/slug');

// @desc    Get all heartbeats for logged in user
// @route   GET /api/heartbeats
router.get('/', protect, async (req, res) => {
    try {
        const heartbeats = await Heartbeat.find({ userId: req.user._id, isActive: true });
        res.json(heartbeats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new heartbeat monitor
// @route   POST /api/heartbeats
router.post('/', protect, async (req, res) => {
    const { name, expectedEvery, expectedEveryUnit, gracePeriod, alertEmail } = req.body;

    try {
        const heartbeat = await Heartbeat.create({
            userId: req.user._id,
            name,
            slug: generateSlug(),
            expectedEvery,
            expectedEveryUnit,
            gracePeriod: gracePeriod || 30,
            alertEmail: alertEmail || req.user.email,
            status: 'PENDING'
        });

        res.status(201).json(heartbeat);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get heartbeat stats (last pings, incidents)
// @route   GET /api/heartbeats/:id/stats
router.get('/:id/stats', protect, async (req, res) => {
    try {
        const heartbeat = await Heartbeat.findById(req.params.id);
        if (!heartbeat || heartbeat.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Heartbeat not found' });
        }

        const logs = await HeartbeatPing.find({ heartbeatId: heartbeat._id })
            .sort({ receivedAt: -1 })
            .limit(50);

        const incidents = await HeartbeatIncident.find({ heartbeatId: heartbeat._id })
            .sort({ detectedAt: -1 });

        res.json({
            heartbeat,
            logs,
            incidents
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete heartbeat monitor (Soft delete)
// @route   DELETE /api/heartbeats/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const heartbeat = await Heartbeat.findById(req.params.id);
        if (!heartbeat || heartbeat.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Heartbeat not found' });
        }

        heartbeat.isActive = false;
        await heartbeat.save();

        res.json({ message: 'Heartbeat monitor removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
