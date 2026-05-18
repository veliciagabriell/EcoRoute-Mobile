function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      console.error('[Validation Error]', {
        path: req.path,
        method: req.method,
        error: error.message,
        body: req.body,
      });
      return res.status(400).json({ error: error.message });
    }
    req.validated = value;
    req.body = value; // Update body with validated values
    next();
  };
}

module.exports = { validateBody };
