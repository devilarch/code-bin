const mongoose = require('mongoose');
const shortid = require('shortid');

const pasteSchema = new mongoose.Schema({
  slug: {
    type: String,
    unique: true,
    default: shortid.generate
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
    default: null
  }
});

// Method to check if IP has viewed this paste
pasteSchema.methods.hasViewedFromIp = function(ip) {
  return this.viewerIps.some(viewer => viewer.ip === ip);
};

// Method to add a new viewer IP
pasteSchema.methods.addViewerIp = function(ip) {
  if (!this.hasViewedFromIp(ip)) {
    this.viewerIps.push({ ip });
    this.views += 1;
    return true;
  }
  return false;
};

module.exports = mongoose.model('Paste', pasteSchema);
