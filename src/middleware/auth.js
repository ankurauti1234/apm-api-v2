// auth-middleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.roles.includes(decoded.role)) {
      return res.status(403).json({ error: "Invalid role in token" });
    }

    req.user = user;
    req.role = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Flexible role restriction middleware
export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

// Specific admin/developer restriction middleware
export const restrictToAdminDev = () => {
  return (req, res, next) => {
    if (!["admin", "developer"].includes(req.role)) {
      return res.status(403).json({ error: "Requires admin or developer privileges" });
    }
    next();
  };
};

export const checkPasswordChange = (req, res, next) => {
  if (req.user.mustChangePassword && req.path !== "/change-password") {
    return res.status(403).json({ 
      error: "Please change your password first",
      mustChangePassword: true 
    });
  }
  next();
};