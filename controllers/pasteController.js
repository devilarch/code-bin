const { body, validationResult } = require('express-validator');
const Paste = require('../models/Paste');

// Validation rules
exports.validatePaste = [
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .escape(),
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
    const paste = new Paste({ content, expiresAt });
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
    res.json(paste);
  } catch (error) {
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
