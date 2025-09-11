const express = require('express');
const router = express.Router();
const { getMeta } = require('../utils/meta');

router.get('/units', (_req, res) => res.json(getMeta().units || []));
router.get('/categories', (_req, res) => res.json(getMeta().categories || []));

module.exports = router;