const { body, validationResult } = require('express-validator');
const Paste = require('../models/Paste');

// Validation rules
exports.validatePaste = [
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required'),
  body('expiresAt')
    .optional()
    .isISO8601().withMessage('Invalid date format (use ISO8601)')
    .toDate()
];

// Controller actions
exports.createPaste = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { content, expiresAt } = req.body;
    const paste = new Paste({ 
      content, 
      expiresAt,
      viewerIps: [] // Initialize empty viewer IPs array
    });
    await paste.save();

    res.status(201).json({
      slug: paste.slug,
      url: `${req.protocol}://${req.get('host')}/api/pastes/${paste.slug}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create paste' });
  }
};

exports.getPaste = async (req, res) => {
  try {
    const paste = await Paste.findOne({ slug: req.params.slug });
    if (!paste) return res.status(404).json({ error: 'Paste not found' });
    
    if (paste.expiresAt && paste.expiresAt <= new Date()) {
      await paste.deleteOne();
      return res.status(410).json({ error: 'Paste has expired' });
    }

    // Check if this IP has already viewed the paste
    const hasViewed = paste.viewerIps.some(viewer => viewer.ip === req.clientIp);
    
    // If it's a new viewer, add their IP and increment the view count
    if (!hasViewed) {
      paste.viewerIps.push({ ip: req.clientIp, timestamp: new Date() });
      paste.views = (paste.views || 0) + 1;
      await paste.save();
    }

    // Return paste with view info but without exposing IPs
    const response = paste.toObject();
    delete response.viewerIps; // Don't expose viewer IPs
    response.isNewView = !hasViewed;
    
    res.json(response);
  } catch (error) {
    console.error('Error retrieving paste:', error);
    res.status(500).json({ error: 'Failed to retrieve paste' });
  }
};

exports.deletePaste = async (req, res) => {
  try {
    const result = await Paste.deleteOne({ slug: req.params.slug });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Paste not found' });
    }
    res.json({ message: 'Paste deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete paste' });
  }
};

// Get paste statistics
exports.getPasteStats = async (req, res) => {
  try {
    const paste = await Paste.findOne({ slug: req.params.slug })
      .select('views createdAt viewerIps');
    
    if (!paste) {
      return res.status(404).json({ error: 'Paste not found' });
    }

    res.json({
      views: paste.views || 0,
      uniqueViewers: paste.viewerIps.length,
      createdAt: paste.createdAt,
      lastViewed: paste.viewerIps.length > 0 
        ? paste.viewerIps[paste.viewerIps.length - 1].timestamp 
        : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve paste statistics' });
  }
};
