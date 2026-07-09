const express = require('express');
const router = express.Router();
const apiVersion = '/v1';
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
router.post(`${apiVersion}/pastes`, createPasteLimiter, validatePaste, createPaste);

// Get specific paste (limited to 100 views per 15 minutes per IP)
router.get(`${apiVersion}/pastes/:slug`, viewPasteLimiter, getPaste);

// Get paste statistics
router.get(`${apiVersion}/pastes/:slug/stats`, viewPasteLimiter, getPasteStats);

// Delete paste (limited to 10 deletions per hour per IP)
router.delete(`${apiVersion}/pastes/:slug`, deletePasteLimiter, deletePaste);

module.exports = router;
