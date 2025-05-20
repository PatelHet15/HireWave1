import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { 
  getAdminJobs, 
  getAllJobs, 
  getJobById, 
  postJob, 
  updateJob,
  updateCandidateStatus
} from "../controllers/job.controller.js";

const router = express.Router();

// Public routes - no authentication required
router.route("/get").get(getAllJobs);
router.route("/get/:id").get(getJobById);

// Protected routes - require authentication
router.route("/post").post(isAuthenticated, postJob);
router.route("/getadminjobs").get(isAuthenticated, getAdminJobs);
router.route("/update/:id").put(isAuthenticated, updateJob);
router.route("/:jobId/candidates/:candidateId/update-status").post(isAuthenticated, updateCandidateStatus);

export default router;
