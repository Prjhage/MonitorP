const express = require('express');
const router = express.Router();
const SslMonitor = require('../models/SslMonitor');
const { protect } = require('../middleware/auth');
const { processSslMonitor } = require('../engine/sslEngine');

// @desc    Get all SSL monitors for logged-in user
// @route   GET /api/ssl
router.get('/', protect, async (req, res) => {
    try {
        const monitors = await SslMonitor.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(monitors);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Create new SSL monitor (triggers immediate first check)
// @route   POST /api/ssl
router.post('/', protect, async (req, res) => {
    try {
        const { name, domain, alertEmail } = req.body;

        // Sanitise the domain — strip protocol, trailing slashes, paths
        const cleanDomain = domain
            .replace(/^https?:\/\//i, '')
            .replace(/\/.*$/, '')
            .trim();

        if (!cleanDomain) {
            return res.status(400).json({ message: 'Invalid domain provided' });
        }

        const monitor = await SslMonitor.create({
            userId: req.user._id,
            name,
            domain: cleanDomain,
            alertEmail: alertEmail || '',
        });

        // Trigger an immediate check in the background (non-blocking)
        processSslMonitor(monitor, null).catch(err =>
            console.error(`[SSL] Initial check failed for ${cleanDomain}:`, err.message)
        );

        // Return quickly — the client can poll or use sockets for the update
        res.status(201).json(monitor);
    } catch (err) {
        console.error('SSL Create Error:', err);
        res.status(400).json({ message: err.message });
    }
});

// @desc    Get single SSL monitor
// @route   GET /api/ssl/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const monitor = await SslMonitor.findById(req.params.id);
        if (!monitor || monitor.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'SSL monitor not found' });
        }
        res.json(monitor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Trigger a manual re-check
// @route   POST /api/ssl/:id/recheck
router.post('/:id/recheck', protect, async (req, res) => {
    try {
        const monitor = await SslMonitor.findById(req.params.id);
        if (!monitor || monitor.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'SSL monitor not found' });
        }

        // Run check synchronously so we can return updated data
        await processSslMonitor(monitor, null);
        const updated = await SslMonitor.findById(req.params.id);
        res.json(updated);
    } catch (err) {
        console.error('SSL Recheck Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// @desc    Toggle active/paused
// @route   PATCH /api/ssl/:id/toggle
router.patch('/:id/toggle', protect, async (req, res) => {
    try {
        const monitor = await SslMonitor.findById(req.params.id);
        if (!monitor || monitor.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'SSL monitor not found' });
        }
        monitor.isActive = !monitor.isActive;
        await monitor.save();
        res.json(monitor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Delete SSL monitor
// @route   DELETE /api/ssl/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const monitor = await SslMonitor.findById(req.params.id);
        if (!monitor || monitor.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'SSL monitor not found' });
        }
        await monitor.deleteOne();
        res.json({ message: 'SSL monitor deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
