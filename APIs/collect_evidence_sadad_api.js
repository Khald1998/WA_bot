const { collect_evidence_data_sadad_version } = require('../services/collect_evidence_data_sadad_version');
const express = require('express');
const router = express.Router();

// POST /collect-evidence-sadad
router.post('/collect-evidence-sadad', async (req, res) => {
    try {
        await collect_evidence_data_sadad_version();
        res.status(200).json({ message: 'SADAD evidence collection finished.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
