require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const connectDB = require('./config/db');
const pasteRoutes = require('./routes/pasteRoutes');
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(compression()); // Add gzip compression
app.use(express.json());

// Add cache control for static assets
const cacheTime = 86400000 * 30; // 30 days
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: cacheTime,
  etag: true,
  lastModified: true
}));

// Database
connectDB();

// Routes
app.use('/api', pasteRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle all routes for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"), {
    maxAge: '1h',
    etag: true,
    lastModified: true
  });
});

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
