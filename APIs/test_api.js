// GET /test route handler
const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Test route working!' });
});

module.exports = router;
