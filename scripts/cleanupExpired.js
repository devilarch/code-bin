const mongoose = require('mongoose');
const Paste = require('../models/Paste');
require('dotenv').config();

const cleanupExpired = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await Paste.deleteMany({ expiresAt: { $lte: new Date() } });
  console.log(`Deleted ${result.deletedCount} expired pastes`);
  process.exit(0);
};

cleanupExpired();
