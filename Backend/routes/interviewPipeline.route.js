import express from "express";
import isAuthenticated, { isAdmin } from "../middlewares/isAuthenticated.js";
import { 
  addInterviewRounds, 
  updateInterviewRound, 
  reorderInterviewRounds, 
  deleteInterviewRound,
  createAptitudeTest,
  getAptitudeTest,
  updateAptitudeTestQuestions,
  updateCandidateProgress,
  submitAptitudeTest,
  getCandidateProgress,
  getCandidateTestAttempt,
  getAllCandidatesProgress,
  deleteAptitudeTest,
  updateAptitudeTest,
  getJobProgress,
  updateCandidateStatus,
  addCandidateToProcess,
  finalizeCandidate,
  getPendingAptitudeTests,
} from "../controllers/interviewPipeline.controller.js";

const router = express.Router();

// Interview rounds management
router.post('/job/:jobId/rounds', isAuthenticated, isAdmin, addInterviewRounds);
router.put('/job/:jobId/interview-rounds', isAuthenticated, isAdmin, addInterviewRounds);
router.put('/job/:jobId/round/:roundId', isAuthenticated, isAdmin, updateInterviewRound);
router.put('/job/:jobId/rounds/reorder', isAuthenticated, isAdmin, reorderInterviewRounds);
router.delete('/job/:jobId/round/:roundId', isAuthenticated, isAdmin, deleteInterviewRound);

// Aptitude test management
router.post('/job/:jobId/round/:roundId/aptitude-test', isAuthenticated, isAdmin, createAptitudeTest);
router.put('/job/:jobId/round/:roundId/aptitude-test', isAuthenticated, isAdmin, updateAptitudeTest);
router.get('/job/:jobId/round/:roundId/aptitude-test', isAuthenticated, getAptitudeTest);
router.get('/aptitude-test/:testId', isAuthenticated, getAptitudeTest);
router.put('/aptitude-test/:testId/questions', isAuthenticated, isAdmin, updateAptitudeTestQuestions);
router.delete('/aptitude-test/:testId', isAuthenticated, isAdmin, deleteAptitudeTest);

// Candidate aptitude tests
router.get('/pending-aptitude-tests', isAuthenticated, getPendingAptitudeTests);

// Candidate progress management
router.put('/job/:jobId/candidate/:candidateId', isAuthenticated, updateCandidateProgress);

// Fix: Make the route handler available to all authenticated users, not just candidates
router.get('/job/:jobId/candidate/:candidateId/progress', isAuthenticated, getCandidateProgress);

// Make an alternative path for the same function in case the original route has issues
router.get('/candidate/:candidateId/job/:jobId/progress', isAuthenticated, getCandidateProgress);

// Add this to your router file where other pipeline routes are defined
router.put('/job/:jobId/candidate/:candidateId/finalize', isAuthenticated, finalizeCandidate);
router.post('/aptitude-test/:testId/submit', isAuthenticated, submitAptitudeTest);
router.get('/job/:jobId/my-progress', isAuthenticated, getCandidateProgress);
router.get('/job/:jobId/candidates', isAuthenticated, getAllCandidatesProgress);
router.get('/aptitude-test/:testId/attempt', isAuthenticated, getCandidateTestAttempt);
router.get('/job/:jobId/progress', isAuthenticated, getJobProgress);
// router.put('/job/:jobId/candidate/:candidateId', isAuthenticated, updateCandidateStatus);
router.post('/job/:jobId/candidate/:candidateId', isAuthenticated, addCandidateToProcess);

export default router;