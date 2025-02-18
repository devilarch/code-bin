require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const pasteRoutes = require('./routes/pasteRoutes');
const cron = require('node-cron');
const { exec } = require('child_process');
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database
connectDB();

// Routes
app.use('/api', pasteRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

//Serve static files from the public dir
app.use(express.static(path.join(__dirname, "public")));

// Scheduled cleanup (runs every hour)
cron.schedule('0 * * * *', () => {
  exec('node ./scripts/cleanupExpired.js', (error) => {
    if (error) console.error('Cleanup failed:', error);
  });
});

app.get("/", (req,res)=>{
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
