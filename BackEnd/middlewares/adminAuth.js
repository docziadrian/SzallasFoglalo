module.exports = function (req, res, next) {
  // Allow a special admin token header (useful for automated scripts)
  const adminToken = process.env.ADMIN_TOKEN;
  const headerToken = req.headers["x-admin-token"];
  if (adminToken && headerToken && headerToken === adminToken) return next();

  const user = req.session && req.session.user;
  if (!user)
    return res.status(401).json({ error: "Unauthorized: admin required" });

  // user.role may be a string or an object { role: 'admin' }
  const role = typeof user.role === "string" ? user.role : user.role?.role;
  if (role === "admin") return next();

  return res.status(403).json({ error: "Forbidden: admin only" });
};
