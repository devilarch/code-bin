const express = require('express');
const router = express.Router();
const { 
  validatePaste, 
  createPaste, 
  getPaste, 
  deletePaste,
  getPasteStats 
} = require('../controllers/pasteController');
const { 
  createPasteLimiter, 
  viewPasteLimiter, 
  deletePasteLimiter,
  getClientIp 
} = require('../middlewares/rateLimiter');

// Apply IP tracking middleware to all routes
router.use(getClientIp);

// Create new paste (limited to 30 per hour per IP)
router.post('/pastes', createPasteLimiter, validatePaste, createPaste);

// Get specific paste (limited to 100 views per 15 minutes per IP)
router.get('/pastes/:slug', viewPasteLimiter, getPaste);

// Get paste statistics
router.get('/pastes/:slug/stats', viewPasteLimiter, getPasteStats);

// Delete paste (limited to 10 deletions per hour per IP)
router.delete('/pastes/:slug', deletePasteLimiter, deletePaste);

module.exports = router;
