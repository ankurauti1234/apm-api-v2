import jwt from "jsonwebtoken";

export const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

export const generateInviteToken = (email) => {
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};