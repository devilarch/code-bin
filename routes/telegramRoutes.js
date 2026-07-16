const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegramController');

// Telegram webhook endpoint
router.post('/telegram-webhook', telegramController.webhook);

// Endpoint to set up the webhook
router.get('/telegram-setup', telegramController.setup);

module.exports = router;
