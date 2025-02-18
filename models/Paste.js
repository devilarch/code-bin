const mongoose = require('mongoose');
const shortid = require('shortid');
const xss = require('xss');

const pasteSchema = new mongoose.Schema({
  slug: {
    type: String,
    unique: true,
    default: shortid.generate
  },
  content: {
    type: String,
    required: true,
    set: (content) => xss(content) // Sanitize on save
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Paste', pasteSchema);
