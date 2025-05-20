import express from "express";
import { 
  login, 
  logout, 
  register, 
  updateProfile, 
  sendEmailNotification, 
  addNotification, 
  markNotificationsAsRead,
  getCurrentUser,
  getCandidateById,
  updateNotificationPreferences,
  updatePassword
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import multipleUpload from "../middlewares/multer.js"

const router = express.Router();

// Public routes
router.route("/register").post(multipleUpload, register);
router.route("/login").post(login);
router.route("/logout").get(logout);

// Protected routes - require authentication
router.route("/update-profile").post(isAuthenticated, multipleUpload, updateProfile);
router.route("/update-password").post(isAuthenticated, updatePassword);
router.route("/me").get(isAuthenticated, getCurrentUser);
router.route("/send-email").post(isAuthenticated, sendEmailNotification);
router.route("/add-notification").post(isAuthenticated, addNotification);
router.route("/mark-notifications-read").post(isAuthenticated, markNotificationsAsRead);
router.route("/update-notification-preferences").post(isAuthenticated, updateNotificationPreferences);
router.route("/candidate/:candidateId").get(isAuthenticated, getCandidateById);

export default router;
