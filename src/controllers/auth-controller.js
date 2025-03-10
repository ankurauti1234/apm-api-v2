import User from "../models/User.js";
import { generateToken, generateInviteToken, generateOTP } from "../utils/generateToken.js";
import { sendInviteEmail } from "../utils/email.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

export const createUser = async (req, res) => {
  const { firstname, lastname, phone, email, company, designation, roles } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already exists" });

    const tempPassword = uuidv4().slice(0, 8);
    const inviteToken = generateInviteToken(email);
    const otp = generateOTP();

    const user = new User({
      firstname,
      lastname,
      phone,
      email,
      company,
      designation,
      roles: roles || ["user"],
      password: tempPassword,
      inviteToken,
      otp,
      otpExpires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    await user.save();
    await sendInviteEmail(email, firstname, inviteToken, tempPassword, otp);

    res.status(201).json({ message: "User created and invitation sent", userId: user._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

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

    res.status(200).json({ 
      message: "Login successful", 
      token: generateToken(user._id, role), // Ensure this field is 'token'
      mustChangePassword: user.mustChangePassword,
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: role,
        created_at: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const activateAccount = async (req, res) => {
  const { token, otp, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      email: decoded.email,
      inviteToken: token,
    });

    if (!user) return res.status(404).json({ error: "Invalid or expired token" });
    if (user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    user.password = newPassword;
    user.inviteToken = null;
    user.otp = null;
    user.otpExpires = null;
    user.isEmailVerified = true;
    user.mustChangePassword = true;
    await user.save();

    res.status(200).json({ message: "Account activated successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// New OTP verification endpoint
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);
    const isPasswordValid = await user.comparePassword(oldPassword);
    
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid old password" });

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const {
      search = '',
      company = '',
      roles = '',
      page = 1,
      limit = 10
    } = req.query;

    // Build query object
    const query = {};
    
    // Search by name or email
    if (search) {
      query.$or = [
        { firstname: { $regex: search, $options: 'i' } },
        { lastname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by company
    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }

    // Filter by roles
    if (roles) {
      query.roles = { $in: roles.split(',') };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute queries
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -otp -inviteToken -otpExpires')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      users,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const editUser = async (req, res) => {
  const { id } = req.params; // User ID to edit
  const { firstname, lastname, phone, company, designation, roles } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user fields
    user.firstname = firstname || user.firstname;
    user.lastname = lastname || user.lastname;
    user.phone = phone || user.phone;
    user.company = company || user.company;
    user.designation = designation || user.designation;
    user.roles = roles || user.roles;

    await user.save();

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params; // User ID to delete

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};