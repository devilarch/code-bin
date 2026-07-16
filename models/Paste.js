const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const pasteSchema = new mongoose.Schema({
  slug: {
    type: String,
    unique: true,
    default: () => nanoid(10)
  },
  language: {
    type: String,
    default: 'plaintext'
  },
  content: {
    type: String,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  viewerIps: [{
    ip: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null,
    expires: 0
  },
  burnAfterReading: {
    type: Boolean,
    default: false
  }
});

// Method to check if IP has viewed this paste
pasteSchema.methods.hasViewedFromIp = function(ip) {
  return this.viewerIps.some(viewer => viewer.ip === ip);
};

// Method to add a new viewer IP
pasteSchema.methods.addViewerIp = function(ip) {
  if (!this.hasViewedFromIp(ip)) {
    this.viewerIps.push({ ip, timestamp: new Date() });
    this.views += 1;
    return true;
  }
  return false;
};

module.exports = mongoose.model('Paste', pasteSchema);