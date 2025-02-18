const express = require('express');
const router = express.Router();
const { validatePaste, createPaste, getPaste, deletePaste } = require('../controllers/pasteController');
const limiter = require('../middlewares/rateLimiter');

router.post('/pastes', limiter, validatePaste, createPaste);
router.get('/pastes/:slug', getPaste);
router.delete('/pastes/:slug', deletePaste);

module.exports = router;
