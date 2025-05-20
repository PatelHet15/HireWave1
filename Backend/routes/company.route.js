import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getCompanies, getCompanyById, getRecruiterCompany, registerCompany, updateCompany } from "../controllers/company.controller.js";
import { multipleUpload, singleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.route("/register").post(isAuthenticated, singleUpload, registerCompany);
router.route("/get").get(isAuthenticated, getCompanies);  // Fixed incorrect import
router.route("/get/:id").get(isAuthenticated, getCompanyById);
router.route("/update/:id").put(isAuthenticated, multipleUpload, updateCompany);
router.route("/recruiter-company").get(isAuthenticated, getRecruiterCompany);

export default router;
