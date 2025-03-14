import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  company: { type: String, required: true },
  designation: { type: String, required: true },
  roles: { 
    type: [String], 
    enum: ["user", "admin", "executive", "developer"], 
    default: ["user"] 
  },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: true },
  inviteToken: { type: String },
  otp: { type: String },
  otpExpires: { type: Date }
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);