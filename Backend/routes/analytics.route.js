import { Router } from "express";
import { getRecruiterAnalytics, trackJobView, trackApplyClick, getTotalActiveJobs } from "../controllers/analytics.controller.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = Router();

// Protected analytics routes
router.get("/recruiter", isAuthenticated, getRecruiterAnalytics);
router.get("/active-jobs", isAuthenticated, getTotalActiveJobs);

// Tracking routes with authentication
router.post("/job/:jobId/view", isAuthenticated, trackJobView);
router.post("/job/:jobId/apply-click", isAuthenticated, trackApplyClick);

export default router;
