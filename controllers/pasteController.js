const { body, validationResult } = require('express-validator');
const Paste = require('../models/Paste');

// Standard error response helper
const errorResponse = (res, status, message) => res.status(status).json({ error: message });

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
    return errorResponse(res, 400, 'Validation failed');
  }

  try {
    const { content, expiresAt } = req.body;
    const paste = new Paste({ 
      content, 
      expiresAt
    });
    await paste.save();

    res.status(201).json({
      slug: paste.slug,
      url: `${req.protocol}://${req.get('host')}/api/pastes/${paste.slug}`
    });
  } catch (error) {
    console.error('Error creating paste:', error);
    errorResponse(res, 500, 'Failed to create paste');
  }
};

exports.getPaste = async (req, res) => {
  try {
    const paste = await Paste.findOne({ slug: req.params.slug });
    if (!paste) return errorResponse(res, 404, 'Paste not found');
    
    if (paste.expiresAt && paste.expiresAt <= new Date()) {
      await paste.deleteOne();
      return errorResponse(res, 410, 'Paste has expired');
    }

    // Use model method to check and add viewer
    const isNewView = paste.addViewerIp(req.clientIp);
    await paste.save();

    // Return paste with view info but without exposing IPs
    const response = paste.toObject();
    delete response.viewerIps; // Don't expose viewer IPs
    response.isNewView = isNewView;
    
    res.json(response);
  } catch (error) {
    console.error('Error retrieving paste:', error);
    errorResponse(res, 500, 'Failed to retrieve paste');
  }
};

exports.deletePaste = async (req, res) => {
  try {
    const result = await Paste.deleteOne({ slug: req.params.slug });
    if (result.deletedCount === 0) {
      return errorResponse(res, 404, 'Paste not found');
    }
    res.json({ message: 'Paste deleted successfully' });
  } catch (error) {
    console.error('Error deleting paste:', error);
    errorResponse(res, 500, 'Failed to delete paste');
  }
};

// Get paste statistics
exports.getPasteStats = async (req, res) => {
  try {
    const paste = await Paste.findOne({ slug: req.params.slug })
      .select('views createdAt viewerIps');
    
    if (!paste) {
      return errorResponse(res, 404, 'Paste not found');
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
    console.error('Error retrieving paste stats:', error);
    errorResponse(res, 500, 'Failed to retrieve paste statistics');
  }
};