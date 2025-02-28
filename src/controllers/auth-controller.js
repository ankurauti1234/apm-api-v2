import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

// Register User
export const register = async (req, res) => {
  const { firstname, lastname, phone, email, company, designation, password, roles } = req.body;

  try {
    const user = new User({
      firstname,
      lastname,
      phone,
      email,
      company,
      designation,
      password,
      roles: roles || ["user"],
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login User
export const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.roles.includes(role)) {
      return res.status(403).json({ error: "You do not have permission to login as this role" });
    }

    const token = generateToken(user._id, role);
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mock Email Verification
export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  if (otp !== "123456") {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  try {
    const user = await User.findOneAndUpdate({ email }, { isEmailVerified: true }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ message: "Email verified successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mock Phone Verification
export const verifyPhone = async (req, res) => {
  const { phone, otp } = req.body;

  if (otp !== "123456") {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  try {
    const user = await User.findOneAndUpdate({ phone }, { isPhoneVerified: true }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ message: "Phone verified successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};