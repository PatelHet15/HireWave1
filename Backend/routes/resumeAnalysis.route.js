import express from 'express';
import { analyzeUserResume } from '../controllers/resumeAnalysis.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';

const router = express.Router();

router.post('/analyze', isAuthenticated, analyzeUserResume);


export default router;
