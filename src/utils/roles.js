function permit(...allowed) {
  return (req, res, next) => {
    const { user } = req;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (allowed.includes(user.role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

module.exports = { permit };
