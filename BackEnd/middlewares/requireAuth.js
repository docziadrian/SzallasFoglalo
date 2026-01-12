module.exports = function requireAuth(req, res, next) {
  if (!req.session || !req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Nincs bejelentkezve" });
  }
  next();
};
