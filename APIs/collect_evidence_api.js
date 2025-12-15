const { collect_evidence_data } = require('../services/collect_evidence_data');
const express = require('express');
const router = express.Router();

// POST /api/collect-evidence
router.post('/collect-evidence', async (req, res) => {
    try {
        await collect_evidence_data();
        res.status(200).json({ message: 'Evidence collection finished.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
