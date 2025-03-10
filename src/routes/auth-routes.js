import express from "express";
import { 
  createUser, 
  login, 
  activateAccount, 
  changePassword,
  verifyOtp,
  listUsers,
  editUser,
  deleteUser
} from "../controllers/auth-controller.js";
import { authenticate, restrictTo, checkPasswordChange } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/activate", activateAccount);
router.post("/verify-otp", verifyOtp);

// Protected routes
router.use(authenticate);
router.post("/create-user", restrictTo("admin"), createUser);
router.get("/list-users", restrictTo("admin"), listUsers);
router.post("/change-password", checkPasswordChange, changePassword);

// Edit and Delete User routes
router.put("/edit-user/:id", restrictTo("admin"), editUser); // Only admins can edit users
router.delete("/delete-user/:id", restrictTo("admin"), deleteUser); // Only admins can delete users

export default router;