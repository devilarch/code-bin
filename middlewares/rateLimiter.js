const rateLimit = require('express-rate-limit');

// Helper function to create a limiter
const createLimiter = (options) => {
  return rateLimit({
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    ...options
  });
};

// Rate limiter for paste creation
exports.createPasteLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 30, // limit each IP to 30 paste creations per window
  message: {
    error: 'Too many pastes created. Please try again later.'
  }
});

// Rate limiter for paste viewing
exports.viewPasteLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // limit each IP to 100 paste views per window
  message: {
    error: 'Too many paste views. Please try again later.'
  }
});

// Rate limiter for paste deletion
exports.deletePasteLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // limit each IP to 10 paste deletions per window
  message: {
    error: 'Too many paste deletions. Please try again later.'
  }
});

// Middleware to get real IP address
exports.getClientIp = (req, res, next) => {
  // Get IP from various headers and fallback to connection remote address
  req.clientIp = 
    req.headers['x-forwarded-for']?.split(',')[0] || 
    req.headers['x-real-ip'] || 
    req.connection.remoteAddress;
  next();
};
