import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { applyJob, getApplicants, getAppliedJobs, updateStatus, getApplicationProgress, checkApplication, notifyCandidate } from "../controllers/application.controller.js";

const router = express.Router();

router.route("/apply/:id").post(isAuthenticated, applyJob);
router.route("/my-applications").get(isAuthenticated, getAppliedJobs);
router.route("/:id/applicants").get(isAuthenticated, getApplicants);
router.route("/status/:id/update").post(isAuthenticated, updateStatus);
router.route("/progress/job/:jobId").get(isAuthenticated, getApplicationProgress);
router.route("/progress/application/:applicationId").get(isAuthenticated, getApplicationProgress);
// In application.routes.js
router.route("/check/:jobId").get(isAuthenticated, checkApplication);
router.route("/notify/:applicationId").post(isAuthenticated, notifyCandidate);

export default router;