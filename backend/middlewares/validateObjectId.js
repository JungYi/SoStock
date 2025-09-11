const mongoose = require('mongoose');

const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'invalid id.' });
  }
  return next();
};

module.exports = validateObjectId;