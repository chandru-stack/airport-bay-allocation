export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userRole = req.user.role_name;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (err) {
      return res.status(403).json({ message: "Forbidden" });
    }
  };
}