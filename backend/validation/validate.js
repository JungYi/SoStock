const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    return next();
  } catch (e) {
    return res.status(400).json({ error: e?.errors?.[0]?.message || 'Invalid payload.' });
  }
};

module.exports = { validate };