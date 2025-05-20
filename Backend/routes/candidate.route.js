import express from 'express';
const router = express.Router();
import { isAuthenticated } from '../middlewares/auth.js';
import { getCandidateById } from '../controllers/user.controller.js';

// Get candidate by ID
router.get('/:candidateId', isAuthenticated, getCandidateById);

export default router; 