// GET /test route handler
const express = require('express');
const router = express.Router();

const { get_test_response } = require('../services/test_service');


router.get('/test', (req, res) => {
  res.json(get_test_response());
});

module.exports = router;
