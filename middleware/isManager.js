const isManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  if (req.user.role !== 'manager' && req.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Access denied. Managers only.' });
  }

  next();
};

module.exports = isManager;
