module.exports = function (req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Nincs bejelentkezve' });
  }
  
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Nincs admin jogosultsága' });
  }
  
  next();
};
