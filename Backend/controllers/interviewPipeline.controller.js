import axios from "axios";
import { Job } from "../models/job.model.js";
import { AptitudeTest } from '../models/aptitudeTest.model.js';
import { TestAttempt } from '../models/testAttempt.model.js';
import { Application } from "../models/application.model.js";
import mongoose from "mongoose";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { User } from "../models/user.model.js";
import { sendEmailNotification } from "../controllers/user.controller.js";


// Add interview rounds to a job
export const addInterviewRounds = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { interviewRounds, templateId } = req.body;
    const userId = req.id;

    console.log('Request to add interview rounds:', {
      jobId,
      userId,
      roundsCount: interviewRounds?.length || 0,
      templateId
    });

    // Validate jobId format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      console.error('Invalid jobId format:', jobId);
      return res.status(400).json({
        message: "Invalid job ID format",
        success: false
      });
    }

    // Verify job exists and user owns it
    const job = await Job.findById(jobId).select('created_by interviewRounds');
    if (!job) {
      console.error('Job not found with ID:', jobId);
      return res.status(404).json({
        message: "Job not found",
        success: false,
        debug: { jobId }
      });
    }

    // Check ownership
    if (job.created_by.toString() !== userId) {
      console.error('User not authorized to modify job:', {
        userId,
        jobOwner: job.created_by.toString()
      });
      return res.status(403).json({
        message: "You don't have permission to update this job",
        success: false
      });
    }

    // Validate rounds data structure
    if (!Array.isArray(interviewRounds)) {
      console.error('Invalid rounds data format (not array):', typeof interviewRounds);
      return res.status(400).json({
        message: "Interview rounds must be provided as an array",
        success: false,
        receivedType: typeof interviewRounds
      });
    }

    if (interviewRounds.length === 0) {
      console.error('Empty rounds array received');
      return res.status(400).json({
        message: "At least one interview round must be provided",
        success: false
      });
    }

    // Validate each round's structure
    const invalidRounds = interviewRounds.filter(round => 
      !round.name || typeof round.name !== 'string' || 
      !round.type || typeof round.type !== 'string'
    );

    if (invalidRounds.length > 0) {
      console.error('Invalid round data detected:', invalidRounds);
      return res.status(400).json({
        message: "Each round must have a valid name and type",
        success: false,
        invalidRounds: invalidRounds.length
      });
    }

    // Prepare interview rounds with proper IDs and ordering
    const formattedRounds = await Promise.all(interviewRounds.map(async (round, index) => {
      const newRound = {
        ...round,
        _id: new mongoose.Types.ObjectId(),
        order: index + 1
      };

      // For aptitude rounds, create a test
      if (round.type === 'aptitude') {
        try {
          console.log('Creating empty aptitude test for round:', round.name);
          const aptitudeTest = new AptitudeTest({
            title: round.name || "Aptitude Assessment",
            description: round.description || "Configure this test in the Aptitude Test Setup",
            duration: 60,
            questions: [], // Empty questions array - will be configured later
            passingScore: round.passingScore || 70,
            jobId: job._id,
            roundId: newRound._id,
            companyId: job.company,
            createdBy: req.id
          });
          
          console.log('Saving empty aptitude test...');
          const savedTest = await aptitudeTest.save();
          console.log('Empty aptitude test saved with ID:', savedTest._id);
          newRound.aptitudeTest = savedTest._id;
          newRound.passingScore = savedTest.passingScore;
          console.log('Round updated with test ID:', newRound.aptitudeTest);
        } catch (error) {
          console.error('Error creating aptitude test:', error);
        }
      }

      return newRound;
    }));

    // Update job with interview rounds
    job.interviewRounds = formattedRounds;
    const savedJob = await job.save();
    await savedJob.populate({
      path: 'interviewRounds',
      populate: { path: 'aptitudeTest', select: '_id' }
    });

    // Add aptitudeTestLink if aptitudeTest exists
    savedJob.interviewRounds = savedJob.interviewRounds.map(round => {
      if (round.type === 'aptitude' && round.aptitudeTest && !round.aptitudeTestLink) {
        return { ...round.toObject(), aptitudeTestLink: `internal:${round.aptitudeTest._id}` };
      }
      return round.toObject ? round.toObject() : round;
    });

    console.log('Successfully added interview rounds to job:', jobId);
    return res.status(200).json({
      message: "Interview rounds added successfully",
      success: true,
      job: {
        _id: savedJob._id,
        interviewRounds: savedJob.interviewRounds,
        templateId // Return the template ID for frontend reference
      },
      roundsCount: formattedRounds.length
    });

  } catch (error) {
    console.error("Error adding interview rounds:", error);
    return res.status(500).json({ 
      message: error.message || "Internal server error", 
      success: false 
    });
  }
};

// Update a specific interview round
export const updateInterviewRound = async (req, res) => {
  try {
    const { jobId, roundId } = req.params;
    const roundData = req.body;
    const userId = req.id;

    // Verify job exists and user owns it
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false
      });
    }

    // Check ownership
    if (job.created_by.toString() !== userId) {
      return res.status(403).json({
        message: "You don't have permission to update this job",
        success: false
      });
    }

    // Find the round to update
    const roundIndex = job.interviewRounds.findIndex(
      round => round._id.toString() === roundId
    );

    if (roundIndex === -1) {
      return res.status(404).json({
        message: "Interview round not found",
        success: false
      });
    }

    // Update round data
    job.interviewRounds[roundIndex] = {
      ...job.interviewRounds[roundIndex].toObject(),
      ...roundData,
      _id: job.interviewRounds[roundIndex]._id // Ensure _id doesn't change
    };

    await job.save();

    return res.status(200).json({
      message: "Interview round updated successfully",
      round: job.interviewRounds[roundIndex],
      success: true
    });
  } catch (error) {
    console.error("Error updating interview round:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

// Reorder interview rounds
export const reorderInterviewRounds = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { roundIds } = req.body;
    const userId = req.id;

    // Verify job exists and user owns it
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false
      });
    }

    // Check ownership
    if (job.created_by.toString() !== userId) {
      return res.status(403).json({
        message: "You don't have permission to update this job",
        success: false
      });
    }

    // Validate roundIds
    if (!Array.isArray(roundIds) || roundIds.length !== job.interviewRounds.length) {
      return res.status(400).json({
        message: "Invalid round IDs provided",
        success: false
      });
    }

    // Create a map of rounds by ID for easy lookup
    const roundsMap = {};
    job.interviewRounds.forEach(round => {
      roundsMap[round._id.toString()] = round;
    });

    // Create new array in the desired order
    const reorderedRounds = roundIds.map((id, index) => {
      const round = roundsMap[id];
      if (!round) {
        throw new Error(`Round with ID ${id} not found`);
      }
      return {
        ...round.toObject(),
        order: index + 1
      };
    });

    // Verify that all rounds from the original template are present
    const originalTypes = job.interviewRounds.map(r => r.type).sort();
    const reorderedTypes = reorderedRounds.map(r => r.type).sort();
    
    if (JSON.stringify(originalTypes) !== JSON.stringify(reorderedTypes)) {
      return res.status(400).json({
        message: "Cannot modify template structure, only reordering is allowed",
        success: false
      });
    }

    job.interviewRounds = reorderedRounds;
    await job.save();

    return res.status(200).json({
      message: "Interview rounds reordered successfully",
      rounds: job.interviewRounds,
      success: true
    });
  } catch (error) {
    console.error("Error reordering interview rounds:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false
    });
  }
};

// Delete an interview round
export const deleteInterviewRound = async (req, res) => {
  try {
    const { jobId, roundId } = req.params;
    const userId = req.id;

    // Verify job exists and user owns it
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false
      });
    }

    // Check ownership
    if (job.created_by.toString() !== userId) {
      return res.status(403).json({
        message: "You don't have permission to update this job",
        success: false
      });
    }

    // Remove the round
    job.interviewRounds = job.interviewRounds.filter(
      round => round._id.toString() !== roundId
    );

    // Reorder remaining rounds
    job.interviewRounds = job.interviewRounds.map((round, index) => ({
      ...round.toObject(),
      order: index + 1
    }));

    await job.save();

    return res.status(200).json({
      message: "Interview round deleted successfully",
      rounds: job.interviewRounds,
      success: true
    });
  } catch (error) {
    console.error("Error deleting interview round:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

// Create or update aptitude test for a round
export const createAptitudeTest = async (req, res) => {
  let session;
  try {
    const { jobId, roundId } = req.params;
    const { title, description, duration, passingScore, questions } = req.body;
    const userId = req.id;

    // Verify job exists and user owns it
    const job = await Job.findById(jobId).populate('company');
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false
      });
    }

    // Check ownership
    if (job.created_by.toString() !== userId) {
      return res.status(403).json({
        message: "You don't have permission to update this job",
        success: false
      });
    }

    // Find the round
    const round = job.interviewRounds.find(r => r._id.toString() === roundId);
    if (!round) {
      return res.status(404).json({
        message: "Interview round not found",
        success: false
      });
    }

    // Verify this is an aptitude round
    if (round.type !== 'aptitude') {
      return res.status(400).json({
        message: "This round is not configured for aptitude testing",
        success: false
      });
    }

    // Start a transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Format questions
    const formattedQuestions = questions.map(q => ({
      questionText: q.questionText || q.question,
      type: q.type || 'multiple-choice',
      options: Array.isArray(q.options) ? 
        (typeof q.options[0] === 'string' ? 
          q.options.map((text, index) => ({
            text,
            isCorrect: index === (q.correctOption || q.correctAnswer)
          })) :
          q.options
        ) : [],
      points: q.points || 1
    }));

    // Check if a test already exists for this round
    let aptitudeTest = await AptitudeTest.findOne({ 
      jobId, 
      roundId
    }).session(session);

    let message = "Aptitude test updated successfully";
    
    if (!aptitudeTest) {
      // Create a new aptitude test if one doesn't exist
      aptitudeTest = new AptitudeTest({
        jobId,
        roundId,
        title,
        description,
        duration,
        passingScore,
        questions: formattedQuestions,
        createdBy: userId
      });
      message = "Aptitude test created successfully";
      // Link the test to the round
      round.aptitudeTest = aptitudeTest._id;
    } else {
      // Update existing test
      aptitudeTest.title = title;
      aptitudeTest.description = description;
      aptitudeTest.duration = duration;
      aptitudeTest.passingScore = passingScore;
      aptitudeTest.questions = formattedQuestions;
    }
    
    await aptitudeTest.save({ session });

    // Update the round's passing score
    round.passingScore = passingScore;
    await job.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message,
      aptitudeTest,
      success: true
    });
  } catch (error) {
    console.error("Error updating aptitude test:", error);
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

// Get aptitude test by test ID or job+round IDs
export const getAptitudeTest = async (req, res) => {
  try {
    // Get parameters from both params and query
    const { testId } = req.params;
    const jobId = req.params.jobId || req.query.jobId;
    const roundId = req.params.roundId || req.query.roundId;
    const userId = req.id;
    
    let aptitudeTest = null;
    
    // Log which parameters we're using for lookup
    console.log('Looking up aptitude test with params:', {
      testId,
      jobId,
      roundId
    });

    // Case 1: Direct lookup by testId
    if (testId) {
      console.log(`Looking up test directly by ID: ${testId}`);
      aptitudeTest = await AptitudeTest.findById(testId);
      
      // If we have jobId and roundId as query params, update the test record
      if (aptitudeTest && jobId && roundId) {
        if (!aptitudeTest.jobId || !aptitudeTest.roundId) {
          console.log(`Updating test ${testId} with jobId ${jobId} and roundId ${roundId}`);
          aptitudeTest.jobId = jobId;
          aptitudeTest.roundId = roundId;
          await aptitudeTest.save();
        }
      }
    } 
    // Case 2: Lookup by job and round IDs
    else if (jobId && roundId) {
      console.log(`Looking up test by jobId: ${jobId} and roundId: ${roundId}`);
      
      // First try to find the job and get the aptitudeTest ID from the specific round
      const job = await Job.findById(jobId);
      if (job) {
        const round = job.interviewRounds.find(r => r._id.toString() === roundId);
        if (round && round.aptitudeTest) {
          aptitudeTest = await AptitudeTest.findById(round.aptitudeTest);
        }
        
        // If not found by round.aptitudeTest, try direct lookup by jobId+roundId
        if (!aptitudeTest) {
          aptitudeTest = await AptitudeTest.findOne({
            jobId,
            roundId
          });
        }
      }
    } else {
      return res.status(400).json({
        message: "Missing required parameters: either testId or both jobId and roundId are required",
        success: false
      });
    }

    if (!aptitudeTest) {
      return res.status(404).json({
        message: "Aptitude test not found",
        success: false
      });
    }

    // For candidates taking the test, don't include the correct answers
    const user = await User.findById(userId);
    const isCandidate = user && user.role === 'candidate';
    let testData = aptitudeTest;
    
    if (isCandidate) {
      // Create a sanitized version without correct answers for candidates
      testData = {
        ...aptitudeTest.toObject(),
        questions: aptitudeTest.questions.map(q => ({
          ...q,
          options: q.options?.map(o => ({ 
            text: o.text,
            // Remove isCorrect field for candidates
            ...(q.type === 'true-false' ? { isCorrect: undefined } : {})
          }))
        }))
      };
    }

    return res.status(200).json({
      message: "Aptitude test retrieved successfully",
      aptitudeTest: testData,
      success: true
    });
  } catch (error) {
    console.error("Error getting aptitude test:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

// Update aptitude test questions ordering
export const updateAptitudeTestQuestions = async (req, res) => {
  try {
    const { testId } = req.params;
    const { questions } = req.body;
    const userId = req.id;

    // Find the test
    const aptitudeTest = await AptitudeTest.findById(testId);
    if (!aptitudeTest) {
      return res.status(404).json({
        message: "Aptitude test not found",
        success: false
      });
    }

    // Verify job exists and user owns it
    const job = await Job.findById(aptitudeTest.jobId);
    if (!job) {
      return res.status(404).json({
        message: "Associated job not found",
        success: false
      });
    }

    // Check ownership
    if (job.created_by.toString() !== userId) {
      return res.status(403).json({
        message: "You don't have permission to update this test",
        success: false
      });
    }

    // Update the questions
    aptitudeTest.questions = questions;
    await aptitudeTest.save();

    return res.status(200).json({
      message: "Aptitude test questions updated successfully",
      aptitudeTest,
      success: true
    });
  } catch (error) {
    console.error("Error updating aptitude test questions:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

export const finalizeCandidate = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;
    const { status } = req.body;
    const recruiterId = req.id; // Get the recruiter ID from the request

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(jobId) || 
        !mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ message: "Invalid ID format", success: false });
    }

    // Validate status
    if (!status || !['hired', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Valid status (hired or rejected) is required", success: false });
    }

    // Find the job
    const job = await Job.findById(jobId).populate('company');
    if (!job) {
      return res.status(404).json({ message: "Job not found", success: false });
    }

    // Find candidate progress
    const candidateProgress = job.candidateProgress.find(
      cp => cp.applicant.toString() === candidateId
    );

    if (!candidateProgress) {
      return res.status(404).json({ message: "Candidate not found in this job", success: false });
    }

    // Update candidate status
    candidateProgress.overallStatus = status;
    candidateProgress.lastUpdated = new Date();

    // Fix inconsistent round statuses based on final status
    if (status === 'hired' || status === 'rejected') {
      // Get all rounds that should be marked as completed
      const interviewRounds = job.interviewRounds || [];
      const roundsStatus = candidateProgress.roundsStatus || [];
      
      console.log(`Updating round statuses for ${status} candidate. Current roundsStatus:`, roundsStatus);
      
      // Process each interview round
      interviewRounds.forEach(round => {
        // Find if this round already has an entry in roundsStatus
        const existingRoundStatus = roundsStatus.find(rs => 
          rs.round && rs.round.toString() === round._id.toString()
        );
        
        if (!existingRoundStatus) {
          // If no entry exists, create one with appropriate status
          console.log(`Adding missing round status for round ${round._id} (${round.name})`);
          candidateProgress.roundsStatus.push({
            round: round._id,
            status: status === 'hired' ? 'passed' : 'failed',
            feedback: status === 'hired' ? 'Auto-passed during finalization' : 'Auto-failed during finalization',
            completedAt: new Date()
          });
        } else if (existingRoundStatus.status === 'pending' || existingRoundStatus.status === 'in_progress') {
          // If the round is still pending or in progress, update it based on final status
          console.log(`Updating pending round status for round ${round._id} (${round.name}) from ${existingRoundStatus.status} to ${status === 'hired' ? 'passed' : 'failed'}`);
          existingRoundStatus.status = status === 'hired' ? 'passed' : 'failed';
          existingRoundStatus.feedback = existingRoundStatus.feedback || 
            (status === 'hired' ? 'Auto-passed during finalization' : 'Auto-failed during finalization');
          existingRoundStatus.completedAt = new Date();
        }
      });
    }

    // Save without full validation to avoid schema issues from earlier
    await job.save({ validateBeforeSave: false });

    // Update the application status
    try {
      const application = await Application.findOne({ job: jobId, applicant: candidateId });
      if (application) {
        if (status === 'hired') {
          // Cannot use 'hired' for application.status, use 'accepted'
          application.status = 'accepted';
          application.overallStatus = 'hired';
          application.currentRound = null;
          application.currentStage = 'Hired';
        } else if (status === 'rejected') {
          // 'rejected' is valid for application.status
          application.status = 'rejected';
          application.overallStatus = 'rejected';
          application.currentRound = null;
          application.currentStage = 'Rejected';
        }
        await application.save();
        
        // Send notification to candidate if enabled
        try {
          // Check if recruiter has enabled sending notifications
          const recruiter = await User.findById(recruiterId);
          if (recruiter && recruiter.notificationPreferences?.sendCandidateNotifications) {
            // Check if candidate has enabled receiving notifications
            const candidate = await User.findById(candidateId);
            if (candidate && candidate.notificationPreferences?.browserNotifications) {
              // Create notification message based on status
              let message = '';
              let notificationType = '';
              
              if (status === 'hired') {
                message = `Congratulations! You've been hired for the ${job.title} position at ${job.company?.name || 'our company'}`;
                notificationType = 'success';
              } else if (status === 'rejected') {
                message = `We regret to inform you that your application for ${job.title} at ${job.company?.name || 'our company'} has been rejected`;
                notificationType = 'info';
              }
              
              if (message) {
                // Add notification to candidate
                if (!candidate.notifications) {
                  candidate.notifications = [];
                }
                
                candidate.notifications.unshift({
                  message,
                  type: notificationType,
                  isRead: false,
                  time: new Date(),
                  createdAt: new Date(),
                  companyLogo: job.company?.logo || '',
                  companyName: job.company?.name || 'Company',
                  jobId: jobId
                });
                
                await candidate.save();
                console.log(`Final decision notification sent to candidate ${candidateId} for ${status} status`);
              }
            } else {
              console.log('Candidate has disabled browser notifications or candidate not found');
            }
          } else {
            console.log('Recruiter has disabled sending candidate notifications or recruiter not found');
          }
        } catch (notificationError) {
          console.error('Error sending notification to candidate:', notificationError);
          // Continue with the response even if notification fails
        }
      } else {
        console.log(`Application not found for job ${jobId} and candidate ${candidateId}`);
      }
    } catch (appError) {
      console.error('Error updating application:', appError);
      // Continue with the response even if application update fails
    }

    return res.status(200).json({
      success: true,
      message: `Candidate ${status === 'hired' ? 'hired' : 'rejected'} successfully`,
      candidateProgress
    });

  } catch (error) {
    console.error("Error finalizing candidate:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update candidate progress in interview rounds
export const updateCandidateProgress = async (req, res) => {
  console.log('Received update request with:', {
    params: req.params,
    body: req.body
  });

  try {
    const { jobId, candidateId } = req.params;
    const { roundId, status, feedback, score } = req.body;
    const recruiterId = req.id; // Get the recruiter ID from the request

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(jobId) || 
        !mongoose.Types.ObjectId.isValid(candidateId) ||
        !mongoose.Types.ObjectId.isValid(roundId)) {
      console.log('Invalid ID format:', { jobId, candidateId, roundId });
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }

    if (!roundId || !status) {
      console.log('Missing required fields:', { roundId, status });
      return res.status(400).json({
        success: false,
        message: "Round ID and status are required"
      });
    }

    const job = await Job.findById(jobId).populate('company');
    if (!job) {
      console.log('Job not found:', jobId);
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    const round = job.interviewRounds.id(roundId);
    if (!round) {
      console.log('Round not found in job:', roundId);
      return res.status(404).json({
        success: false,
        message: "Round not found"
      });
    }

    // Find or create candidate progress
    let candidateProgress = job.candidateProgress.find(
      cp => cp.applicant.toString() === candidateId
    );

    // Make sure score is within valid range (0-100)
    const validatedScore = score !== undefined ? Math.min(100, Math.max(0, parseInt(score) || 0)) : 0;

    if (!candidateProgress) {
      candidateProgress = {
        applicant: candidateId,
        currentRound: roundId,
        roundsStatus: [{
          round: roundId,
          status,
          feedback: feedback || '',
          score: validatedScore,
          completedAt: new Date()
        }],
        overallStatus: 'in_process', // Use 'in_process' for Job.candidateProgress
        lastUpdated: new Date()
      };
      job.candidateProgress.push(candidateProgress);
    } else {
      // Update existing progress
      let roundStatus = candidateProgress.roundsStatus.find(
        rs => rs.round.toString() === roundId
      );

      if (!roundStatus) {
        roundStatus = {
          round: roundId,
          status,
          feedback: feedback || '',
          score: validatedScore,
          completedAt: new Date()
        };
        candidateProgress.roundsStatus.push(roundStatus);
      } else {
        roundStatus.status = status;
        roundStatus.feedback = feedback || '';
        if (score !== undefined) roundStatus.score = validatedScore;
        roundStatus.completedAt = new Date();
      }

      // Update overall status
      if (status === 'passed') {
        const nextRound = job.interviewRounds.find(r => r.order === round.order + 1);
        
        if (!nextRound) {
          // This was the last round, mark as hired instead of awaiting_final_decision
          candidateProgress.overallStatus = 'hired';
          candidateProgress.currentRound = roundId; // Stay on this round
        } else {
          candidateProgress.currentRound = nextRound._id;
          candidateProgress.overallStatus = 'in_process'; // Use 'in_process' for Job.candidateProgress
        }
      } else if (status === 'failed') {
        candidateProgress.overallStatus = 'rejected';
      }
      
      candidateProgress.lastUpdated = new Date();
    }

    // Update application status to match candidate progress
    try {
      const application = await Application.findOne({ job: jobId, applicant: candidateId });
      if (application) {
        // Map candidateProgress.overallStatus to application.status (enum: 'pending', 'accepted', 'rejected')
        if (candidateProgress.overallStatus === 'in_process') {
          // Keep as 'accepted' when in process
          application.status = 'accepted';
          // Set application.overallStatus (enum: 'applied', 'in_progress', 'hired', 'rejected')
          application.overallStatus = 'in_progress';
        } else if (candidateProgress.overallStatus === 'hired') {
          // Cannot use 'hired' for application.status, use 'accepted'
          application.status = 'accepted';
          application.overallStatus = 'hired';
          application.currentRound = null;
          application.currentStage = 'Hired';
        } else if (candidateProgress.overallStatus === 'rejected') {
          // 'rejected' is valid for both
          application.status = 'rejected';
          application.overallStatus = 'rejected';
          application.currentRound = null;
          application.currentStage = 'Rejected';
        }
        
        // Update application currentStage based on round
        if (status === 'passed' && round) {
          const nextRound = job.interviewRounds.find(r => r.order === round.order + 1);
          if (nextRound) {
            application.currentStage = nextRound.name || 'Next Round';
            application.currentRound = nextRound._id;
            
            // Make sure the roundsStatus array includes the next round
            const hasNextRoundStatus = application.roundsStatus.some(
              rs => rs.round.toString() === nextRound._id.toString()
            );
            
            if (!hasNextRoundStatus) {
              application.roundsStatus.push({
                round: nextRound._id,
                status: 'pending',
                feedback: '',
                updatedAt: new Date()
              });
            }
            
            console.log('Updated application currentRound to:', nextRound.name);
          } else {
            application.currentStage = 'Final Decision';
            application.currentRound = null; // No more rounds
          }
        } else if (status === 'failed') {
          application.currentStage = 'Rejected';
          application.currentRound = null; // Failed, so no current round
        }
        
        // Sync roundsStatus between job.candidateProgress and application
        // First, find or create the roundStatus in application.roundsStatus
        let appRoundStatus = application.roundsStatus.find(
          rs => rs.round.toString() === roundId
        );
        
        if (!appRoundStatus) {
          // If the round status doesn't exist in the application, create it
          appRoundStatus = {
            round: roundId,
            status: status,
            feedback: feedback || '',
            updatedAt: new Date()
          };
          application.roundsStatus.push(appRoundStatus);
        } else {
          // Update existing round status
          appRoundStatus.status = status;
          appRoundStatus.feedback = feedback || appRoundStatus.feedback;
          appRoundStatus.updatedAt = new Date();
        }
        
        // Make sure application.currentRound is set correctly
        if (status === 'passed') {
          const nextRound = job.interviewRounds.find(r => r.order === round.order + 1);
          if (nextRound) {
            application.currentRound = nextRound._id;
          }
        } else if (status === 'failed') {
          // Keep the current round, but mark as failed
        }
        
        console.log('Updating application with synced roundsStatus:', application.roundsStatus);
        await application.save();
        
        // Send notification to candidate if enabled
        try {
          // Check if recruiter has enabled sending notifications
          const recruiter = await User.findById(recruiterId);
          if (recruiter && recruiter.notificationPreferences?.sendCandidateNotifications) {
            // Check if candidate has enabled receiving notifications
            const candidate = await User.findById(candidateId);
            if (candidate && candidate.notificationPreferences?.browserNotifications) {
              // Create notification message based on status
              let message = '';
              let notificationType = '';
              
              if (status === 'passed') {
                message = `Congratulations! You've passed the ${round.name} round for ${job.title}`;
                notificationType = 'success';
              } else if (status === 'failed') {
                message = `We regret to inform you that you did not pass the ${round.name} round for ${job.title}`;
                notificationType = 'info';
              }
              
              if (message) {
                // Add notification to candidate
                if (!candidate.notifications) {
                  candidate.notifications = [];
                }
                
                candidate.notifications.unshift({
                  message,
                  type: notificationType,
                  isRead: false,
                  time: new Date(),
                  createdAt: new Date(),
                  companyLogo: job.company?.logo || '',
                  companyName: job.company?.name || 'Company',
                  jobId: jobId
                });
                
                await candidate.save();
                console.log(`Notification sent to candidate ${candidateId} for ${status} status in round ${round.name}`);
              }
            } else {
              console.log('Candidate has disabled browser notifications or candidate not found');
            }
          } else {
            console.log('Recruiter has disabled sending candidate notifications or recruiter not found');
          }
        } catch (notificationError) {
          console.error('Error sending notification to candidate:', notificationError);
          // Continue with the response even if notification fails
        }
      }
    } catch (appError) {
      console.error('Error updating application:', appError);
      // Continue with job update even if application update fails
    }

    await job.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Candidate progress updated",
      candidateProgress
    });

  } catch (error) {
    console.error("Full error stack:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit aptitude test
export const submitAptitudeTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { answers } = req.body;
    // Get jobId and roundId from body or params
    const jobId = req.body.jobId || req.params.jobId;
    const roundId = req.body.roundId || req.params.roundId;
    const userId = req.id;

    console.log('Submitting aptitude test:', {
      testId,
      jobId,
      roundId,
      userId,
      answersCount: answers ? Object.keys(answers).length : 0
    });

    // Validate inputs
    if (!testId) {
      return res.status(400).json({ message: "Test ID is required", success: false });
    }

    // Find the aptitude test
    const aptitudeTest = await AptitudeTest.findById(testId);
    if (!aptitudeTest) {
      return res.status(404).json({ message: "Aptitude test not found", success: false });
    }

    // Get the job
    const job = await Job.findById(jobId || aptitudeTest.jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found", success: false });
    }

    // Find the application
    const application = await Application.findOne({
      job: job._id,
      applicant: userId
    });
    if (!application) {
      return res.status(404).json({ message: "Application not found", success: false });
    }

    // Find the aptitude round
    let aptitudeRound;
    
    if (roundId) {
      // If roundId is provided, find the round by ID
      aptitudeRound = job.interviewRounds.find(round => 
        round._id.toString() === roundId
      );
    }
    
    // If not found by roundId, try using the test's roundId
    if (!aptitudeRound && aptitudeTest.roundId) {
      aptitudeRound = job.interviewRounds.find(round => 
        round._id.toString() === aptitudeTest.roundId.toString()
      );
    }
    
    // If still not found, look for any aptitude round
    if (!aptitudeRound) {
      aptitudeRound = job.interviewRounds.find(round => 
        round.type === 'aptitude'
      );
    }

    if (!aptitudeRound) {
      return res.status(400).json({ 
        message: "No aptitude round found for this test", 
        success: false 
      });
    }

    console.log('Found aptitude round:', aptitudeRound.name);
    
    // Calculate score
    let score = 0;
    const totalQuestions = aptitudeTest.questions.length;
    const totalPossiblePoints = aptitudeTest.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    
    aptitudeTest.questions.forEach((question, index) => {
      const userAnswer = answers[index];
      
      if (userAnswer !== undefined && userAnswer !== null) {
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          // For multiple-choice, check if selected option is correct
          const selectedOption = question.options[userAnswer];
          if (selectedOption && selectedOption.isCorrect) {
            score += question.points || 1;
          }
        } else if (question.type === 'short-answer') {
          // For short answers, we'll give full points if not empty
          // In a real app, you might want manual grading for these
          if (typeof userAnswer === 'string' && userAnswer.trim() !== '') {
            score += question.points || 1;
          }
        }
      }
    });

    // Calculate percentage score and ensure it's within 0-100 range
    const percentageScore = Math.min(100, Math.round((score / (totalPossiblePoints || 1)) * 100));
    const passed = percentageScore >= aptitudeTest.passingScore;

    // Create/update test attempt
    const testAttempt = await TestAttempt.findOneAndUpdate(
      { testId, candidateId: userId },
      {
        answers,
        score,
        percentageScore,
        passed,
        completionTime: new Date(),
        completed: true
      },
      { upsert: true, new: true }
    );

    // Update candidate progress
    let candidateProgress = job.candidateProgress.find(
      cp => cp.applicant.toString() === userId
    );

    if (!candidateProgress) {
      candidateProgress = {
        applicant: userId,
        currentRound: aptitudeRound._id,
        roundsStatus: [],
        overallStatus: 'in_process', // Use 'in_process' for Job model's enum
        lastUpdated: new Date()
      };
      job.candidateProgress.push(candidateProgress);
    }

    // Update round status
    const roundStatusIndex = candidateProgress.roundsStatus.findIndex(
      rs => rs.round.toString() === aptitudeRound._id.toString()
    );

    if (roundStatusIndex >= 0) {
      candidateProgress.roundsStatus[roundStatusIndex] = {
        round: aptitudeRound._id,
        status: passed ? 'passed' : 'failed',
        score: percentageScore, // Already capped at 100
        completedAt: new Date()
      };
    } else {
      candidateProgress.roundsStatus.push({
        round: aptitudeRound._id,
        status: passed ? 'passed' : 'failed',
        score: percentageScore, // Already capped at 100
        completedAt: new Date()
      });
    }

    // Update overall status and current round if passed
    if (passed) {
      const nextRound = job.interviewRounds.find(
        r => r.order === aptitudeRound.order + 1
      );
      
      console.log('Test passed. Current round:', aptitudeRound.name);
      console.log('Next round found:', nextRound ? nextRound.name : 'None (last round)');
      
      if (nextRound) {
        // Update candidateProgress in Job model
        candidateProgress.currentRound = nextRound._id;
        
        // Update Application model - explicitly set currentRound
        application.currentRound = nextRound._id;
        
        // For Application.currentStage (string field, not enum)
        application.currentStage = nextRound.name || 'Next Round';
        
        // For Application.status (valid enums: 'pending', 'accepted', 'rejected')
        // Keep as 'accepted' when moving to next round
        application.status = 'accepted';
        
        // For Application.overallStatus (valid enums: 'applied', 'in_progress', 'hired', 'rejected')
        application.overallStatus = 'in_progress';
        
        // Add the next round to roundsStatus if it doesn't exist
        const hasNextRoundStatus = application.roundsStatus.some(
          rs => rs.round.toString() === nextRound._id.toString()
        );
        
        if (!hasNextRoundStatus) {
          application.roundsStatus.push({
            round: nextRound._id,
            status: 'pending',
            feedback: '',
            updatedAt: new Date()
          });
        }
        
        console.log('Updated application currentRound to:', nextRound.name);
      } else {
        // This was the last round and candidate passed
        candidateProgress.overallStatus = 'hired';
        application.currentRound = null;
        application.currentStage = 'Hired';
        application.status = 'accepted'; // Keep as 'accepted', not 'hired' which isn't a valid enum
        application.overallStatus = 'hired';
      }
    } else {
      // Failed the test
      candidateProgress.overallStatus = 'rejected';
      application.currentRound = null;
      application.currentStage = 'Rejected';
      application.status = 'rejected'; // 'rejected' is valid in both models
      application.overallStatus = 'rejected';
    }

    // Save with validateBeforeSave:false to bypass validation if needed
    console.log('Saving job and application updates...');
    await job.save({ validateBeforeSave: false });
    await application.save();
    
    console.log('Updates saved successfully.');
    
    // Send email notification to candidate about test results
    try {
      // Get candidate details
      const candidate = await User.findById(userId);
      if (!candidate) {
        console.error('Could not find candidate for email notification:', userId);
      } else {
        // Get company details from the job
        const company = await User.findById(job.company);
        
        // Initialize company logo variable
        let companyLogo = null;
        
        // Try to get company logo from company profile
        if (company?.profile?.profilePhoto && company.profile.profilePhoto.trim() !== '' && company.profile.profilePhoto.startsWith('http')) {
          companyLogo = company.profile.profilePhoto;
          console.log('Using company profile photo as logo:', companyLogo);
        }
        
        // Get next round details if candidate passed
        let nextRound = null;
        if (passed) {
          const currentRoundIndex = job.interviewRounds.findIndex(r => r._id.toString() === aptitudeRound._id.toString());
          if (currentRoundIndex >= 0 && currentRoundIndex < job.interviewRounds.length - 1) {
            nextRound = job.interviewRounds[currentRoundIndex + 1];
          }
        }
        
        // Prepare next steps message
        const nextStepsMessage = passed 
          ? nextRound 
            ? `Your next step is the ${nextRound.name} round. ${nextRound.type === 'technical' 
                ? 'You will have a technical interview. Our team will contact you with more details soon.'
                : nextRound.type === 'hr' 
                  ? 'You will have an HR interview. Our team will contact you with more details soon.'
                  : 'Please check your dashboard for more details about the next steps.'}` 
            : 'You have successfully completed all interview rounds. Our hiring team is now reviewing your overall performance and will make a final decision shortly.'
          : 'We appreciate your interest in our company and the time you invested in the application process. We encourage you to apply for future positions that match your qualifications.';
        
        // Use the sendEmailNotification function imported at the top of the file
        
        // First, get the populated job with company details
        const populatedJob = await Job.findById(job._id).populate('company');
        console.log('Populated job for email:', populatedJob ? populatedJob.title : 'Not found');
        
        // Get company data from the populated job
        const companyData = populatedJob.company;
        console.log('Company data for email:', companyData ? companyData.name : 'Not found');
        
        // Get company logo, name, location, and email
        let companyName = populatedJob.title.split(' ').pop() || 'HireWave';
        let companyLocation = populatedJob.jobLocation || 'Remote';
        let companyEmail = 'contact@hirewave.com';
        
        // Use actual company data if available
        if (companyData) {
          // Set company name
          if (companyData.name && companyData.name.trim() !== '') {
            companyName = companyData.name;
          }
          
          // Set company logo
          if (companyData.logo && companyData.logo.trim() !== '' && companyData.logo.startsWith('http')) {
            // Use the company logo as is, without any replacements
            companyLogo = companyData.logo;
            console.log('Company logo fetched successfully:', companyLogo);
          }
          
          // Set company location
          if (companyData.location && companyData.location.trim() !== '') {
            companyLocation = companyData.location;
          }
          
          // Try to get company email
          if (companyData.userId) {
            const companyUser = await User.findById(companyData.userId);
            if (companyUser && companyUser.email) {
              companyEmail = companyUser.email;
            }
          }
        }
        
        console.log('Using company data for email:', {
          name: companyName,
          location: companyLocation,
          logo: companyLogo ? 'Logo found' : 'No logo'
        });
        
        // Try to find the company in the Company model if we still don't have a logo
        if ((!companyLogo || !companyLogo.startsWith('http')) && companyName) {
          try {
            const { Company } = await import('../models/company.model.js');
            const companyRecord = await Company.findOne({ name: companyName });
            
            if (companyRecord && companyRecord.logo && companyRecord.logo.startsWith('http')) {
              companyLogo = companyRecord.logo;
              console.log('Found company logo from Company model:', companyLogo);
            }
          } catch (err) {
            console.error('Error fetching from Company model:', err);
          }
        }
        
        // Final check to ensure we have a valid logo URL
        if (companyLogo && companyLogo.startsWith('http')) {
          console.log('Using company logo URL for email template:', companyLogo);
        }

        // Prepare the email data
        const emailData = {
          to: candidate.email,
          subject: `${passed ? 'Congratulations' : 'Update'} - ${populatedJob.title} Application - Aptitude Test ${passed ? 'Passed' : 'Result'}`,
          template: passed ? 'acceptance' : 'update',
          data: {
            candidateName: candidate.fullname,
            message: passed
              ? `We're pleased to inform you that you have successfully passed the Aptitude Test round of your application for the ${populatedJob.title} position. Your score was ${percentageScore}%.`
              : `We regret to inform you that you did not meet our requirements for the Aptitude Test round of your application for the ${populatedJob.title} position. Your score was ${percentageScore}%, which is below our passing threshold of ${aptitudeTest.passingScore}%.`,
            nextSteps: nextStepsMessage,
            feedback: `You scored ${score} out of ${totalPossiblePoints} points (${percentageScore}%).`,
            companyName: companyName,
            position: populatedJob.title,
            roundName: 'Aptitude Test',
            companyAddress: companyLocation,
            contactEmail: companyEmail,
            companyLogo: companyLogo,
            companyLogoUrl: companyLogo,
            hasCompanyLogo: !!companyLogo,
            footerLogoUrl: 'https://res.cloudinary.com/dpdffedd1/image/upload/v1746942040/logo2_gyaynp.png',
            // Additional properties for improved image display
            logoWidth: 200,
            logoHeight: 80,
            footerLogoHeight: 50,
            emailTitle: `Aptitude Test ${passed ? 'Passed' : 'Results'}`,
            headerColor: passed ? '#4CAF50' : '#607D8B',
            headerBackground: passed 
              ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)' 
              : 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)',
            footerLinks: [
              { text: 'Visit Dashboard', url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard` },
              { text: 'Contact Support', url: 'mailto:support@hirewave.com' }
            ],
            socialLinks: [
              { platform: 'facebook', url: 'https://facebook.com/hirewave' },
              { platform: 'twitter', url: 'https://twitter.com/hirewave' },
              { platform: 'linkedin', url: 'https://linkedin.com/company/hirewave' }
            ],
            termsAndConditions: passed ? [
              'Please check your dashboard regularly for updates on your application status.',
              'Prepare thoroughly for your next interview round using the resources provided.',
              'Ensure your contact information is up-to-date in your profile.',
              'Respond promptly to any additional requests for information.',
              'Contact our recruitment team if you have any questions about the process.'
            ] : [
              'This decision is not a reflection of your qualifications or abilities.',
              'We keep all applications on file for future reference.',
              'You are welcome to apply for other positions that match your skills and experience.',
              'We wish you success in your job search and professional endeavors.'
            ]
          }
        };
        
        // Create a mock request and response object for the sendEmailNotification function
        const mockReq = { body: emailData };
        const mockRes = {
          status: function(statusCode) {
            return {
              json: function(data) {
                if (statusCode === 200 && data.success) {
                  console.log(`Aptitude test result email sent to ${candidate.email} (${passed ? 'Passed' : 'Failed'})`);
                } else {
                  console.error('Failed to send email:', data.message);
                }
                return data;
              }
            };
          }
        };
        
        // Call the sendEmailNotification function directly
        await sendEmailNotification(mockReq, mockRes);
      }
    } catch (emailError) {
      console.error('Failed to send aptitude test result email:', emailError);
      // Don't fail the request if email sending fails
    }
    
    return res.status(200).json({
      message: "Test submitted successfully",
      success: true,
      result: {
        score,
        percentageScore,
        passed,
        completionTime: new Date()
      }
    });
  } catch (error) {
    console.error("Error submitting aptitude test:", error);
    return res.status(500).json({ 
      message: error.message || "Internal server error", 
      success: false 
    });
  }
};

// Get candidate's own progress for a specific job
export const getCandidateProgress = async (req, res) => {
  try {
    console.log('getCandidateProgress called with params:', req.params);
    let { jobId, candidateId } = req.params;
    
    // If candidateId is not provided, use the authenticated user's ID
    if (!candidateId) {
      candidateId = req.id; // Use the authenticated user's ID from the token
      console.log('Using authenticated user ID as candidateId:', candidateId);
    }

    // Validate inputs
    if (!jobId) {
      console.error('Missing required parameter: jobId');
      return res.status(400).json({
        message: "Job ID is required",
        success: false
      });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId) || 
        !mongoose.Types.ObjectId.isValid(candidateId)) {
      console.error('Invalid ID format:', { jobId, candidateId });
      return res.status(400).json({
        message: "Invalid job or candidate ID format",
        success: false
      });
    }

    // Check if the job exists
    console.log('Looking up job:', jobId);
    const job = await Job.findById(jobId)
      .populate('interviewRounds');
    
    if (!job) {
      console.error('Job not found:', jobId);
      return res.status(404).json({
        message: "Job not found",
        success: false
      });
    }
    console.log('Found job:', job.title);

    // Check if the candidate exists
    console.log('Looking up candidate:', candidateId);
    const candidate = await User.findById(candidateId);
    if (!candidate) {
      console.error('Candidate not found:', candidateId);
      return res.status(404).json({
        message: "Candidate not found",
        success: false
      });
    }
    console.log('Found candidate:', candidate.fullname);

    // Find candidate progress in this job
    const candidateProgress = job.candidateProgress ? job.candidateProgress.find(
      cp => cp.applicant.toString() === candidateId
    ) : null;

    console.log('candidateProgress found:', !!candidateProgress);

    // If no progress found, return empty data structure
    if (!candidateProgress) {
      console.log('No progress found for candidate in this job, returning default structure');
      
      // Return a default structure with pending status
      const defaultResponse = {
        applicant: {
          _id: candidate._id,
          fullname: candidate.fullname,
          email: candidate.email,
          profile: candidate.profile
        },
        currentRound: job.interviewRounds && job.interviewRounds.length > 0 ? job.interviewRounds[0]._id : null,
        overallStatus: 'pending',
        lastUpdated: new Date(),
        rounds: job.interviewRounds ? job.interviewRounds.map(round => ({
          _id: round._id,
          name: round.name,
          type: round.type,
          order: round.order,
          status: 'pending',
          feedback: '',
          score: null,
          updatedAt: new Date()
        })) : []
      };

      return res.status(200).json({
        message: "No progress found for this candidate, returning default structure",
        progress: defaultResponse,
        success: true
      });
    }

    // Format the candidate information
    const candidateInfo = {
      _id: candidate._id,
      fullname: candidate.fullname,
      email: candidate.email,
      profile: candidate.profile
    };

    // Format the response
    const responseData = {
      applicant: candidateInfo,
      currentRound: candidateProgress.currentRound,
      overallStatus: candidateProgress.overallStatus || 'pending',
      lastUpdated: candidateProgress.lastUpdated || new Date(),
      rounds: job.interviewRounds.map(round => {
        const roundStatus = candidateProgress.roundsStatus.find(
          rs => rs.round.toString() === round._id.toString()
        );

        return {
          _id: round._id,
          name: round.name,
          type: round.type,
          order: round.order,
          status: roundStatus ? roundStatus.status : 'pending',
          feedback: roundStatus ? roundStatus.feedback : '',
          score: roundStatus ? roundStatus.score : null,
          completedAt: roundStatus ? roundStatus.completedAt : null,
          updatedAt: roundStatus ? roundStatus.updatedAt || new Date() : new Date()
        };
      })
    };

    console.log('Returning progress data for candidate');
    return res.status(200).json({
      message: "Candidate progress retrieved successfully",
      progress: responseData,
      success: true
    });

  } catch (error) {
    console.error('Error fetching candidate progress:', error);
    return res.status(500).json({
      message: "Internal server error while fetching candidate progress",
      success: false,
      error: error.message
    });
  }
};

// Get pending aptitude tests for a candidate
export const getPendingAptitudeTests = async (req, res) => {
  try {
    const userId = req.id;

    console.log('Getting pending tests for user:', userId);

    // Find all applications for this candidate
    const applications = await Application.find({ 
      applicant: userId,
      status: 'accepted',
      currentRound: { $exists: true }
    }).populate({
      path: 'job',
      populate: [{
        path: 'interviewRounds',
        populate: {
          path: 'aptitudeTest'
        }
      }, {
        path: 'company',
        select: 'name'
      }]
    });

    console.log('Found applications:', applications.length);

    const pendingTests = [];

    for (const application of applications) {
      if (!application.job || !application.job.interviewRounds?.length) {
        console.log('Skipping application - no job or rounds:', application._id);
        continue;
      }

      // Find the current round
      const currentRound = application.job.interviewRounds.find(round => 
        round._id.toString() === application.currentRound?.toString()
      );

      if (!currentRound) {
        console.log('Current round not found:', application.currentRound);
        continue;
      }

      console.log('Checking round:', {
        roundId: currentRound._id,
        roundType: currentRound.type,
        hasTest: !!currentRound.aptitudeTest,
        testId: currentRound.aptitudeTest?._id,
        applicationId: application._id
      });

      // Check if this is an aptitude round and it's pending
      const roundStatus = application.roundsStatus?.find(rs => 
        rs.round.toString() === application.currentRound?.toString()
      );

      if (currentRound.type === 'aptitude' && 
          roundStatus?.status === 'pending' && 
          currentRound.aptitudeTest) {
        pendingTests.push({
          jobId: application.job._id,
          jobTitle: application.job.title,
          company: application.job.company?.name || 'Unknown Company',
          roundId: currentRound._id,
          roundName: currentRound.name,
          testId: currentRound.aptitudeTest._id,
          applicationId: application._id
        });
        console.log('Added pending test:', {
          roundId: currentRound._id,
          testId: currentRound.aptitudeTest._id
        });
      } else {
        console.log('Round not eligible:', {
          isAptitude: currentRound.type === 'aptitude',
          isPending: roundStatus?.status === 'pending',
          hasTest: !!currentRound.aptitudeTest
        });
      }
    }

    console.log('Final pending tests:', pendingTests);

    return res.status(200).json({
      success: true,
      pendingTests
    });
  } catch (error) {
    console.error('Error in getPendingAptitudeTests:', error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message
    });
  }
};

// Get candidate's test attempt
export const getCandidateTestAttempt = async (req, res) => {
  try {
    const { testId } = req.params;
    const candidateId = req.id;

    // Find test attempt
    const testAttempt = await TestAttempt.findOne({
      testId,
      candidateId
    });

    if (!testAttempt) {
      return res.status(200).json({
        message: "No test attempt found",
        success: true,
        testAttempt: null
      });
    }

    return res.status(200).json({
      message: "Test attempt retrieved successfully",
      success: true,
      testAttempt
    });
  } catch (error) {
    console.error("Error getting test attempt:", error);
    return res.status(500).json({
      message: "Internal server error", 
      success: false
    });
  }
};

// Get all candidates' progress for a job
export const getAllCandidatesProgress = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.id;

    const job = await Job.findById(jobId)
      .populate('interviewRounds')
      .populate({
        path: 'candidateProgress.applicant',
        select: 'fullname email profilePhoto'
      });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false
      });
    }

    // Check ownership
    if (job.created_by.toString() !== userId) {
      return res.status(403).json({
        message: "You don't have permission to view this data",
        success: false
      });
    }

    // Format the response
    const candidatesProgress = job.candidateProgress.map(cp => ({
      applicant: cp.applicant,
      currentRound: cp.currentRound,
      overallStatus: cp.overallStatus,
      lastUpdated: cp.lastUpdated,
      rounds: job.interviewRounds.map(round => {
        const roundStatus = cp.roundsStatus.find(
          rs => rs.round.toString() === round._id.toString()
        );

        return {
          _id: round._id,
          name: round.name,
          type: round.type,
          order: round.order,
          status: roundStatus ? roundStatus.status : 'pending',
          score: roundStatus ? roundStatus.score : null,
          feedback: roundStatus ? roundStatus.feedback : null,
          completedAt: roundStatus ? roundStatus.completedAt : null
        };
      })
    }));

    return res.status(200).json({
      candidatesProgress,
      success: true
    });
  } catch (error) {
    console.error("Error fetching all candidates progress:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
}; 

// Delete aptitude test
export const deleteAptitudeTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.id;

    // Find the test
    const aptitudeTest = await AptitudeTest.findById(testId);
    if (!aptitudeTest) {
      return res.status(404).json({
        message: "Aptitude test not found",
        success: false
      });
    }

    // Verify job exists and user owns it
    const job = await Job.findById(aptitudeTest.jobId);
    if (!job) {
      return res.status(404).json({
        message: "Associated job not found",
        success: false
      });
    }

    // Check ownership
    if (job.created_by.toString() !== userId) {
      return res.status(403).json({
        message: "You don't have permission to delete this test",
        success: false
      });
    }

    // Find the round that contains this test
    const round = job.interviewRounds.find(
      r => r.aptitudeTestLink === `internal:${testId}`
    );

    if (round) {
      // Remove the test link from the round
      round.aptitudeTestLink = undefined;
      round.passingScore = undefined;
      await job.save();
    }

    // Delete the test
    await AptitudeTest.findByIdAndDelete(testId);

    // Delete all test attempts
    await TestAttempt.deleteMany({ testId });

    return res.status(200).json({
      message: "Aptitude test deleted successfully",
      success: true
    });
  } catch (error) {
    console.error("Error deleting aptitude test:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

// Update aptitude test
export const updateAptitudeTest = async (req, res) => {
  let session;
  try {
    const { jobId, roundId } = req.params;
    const { title, description, duration, passingScore, questions } = req.body;
    const userId = req.id;

    // Start a transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Find the job
    const job = await Job.findById(jobId).session(session);
    if (!job) {
      return res.status(404).json({ message: "Job not found", success: false });
    }
    
    // Check ownership
    if (job.created_by.toString() !== userId) {
      return res.status(403).json({ message: "You don't have permission to update this job", success: false });
    }
    
    // Find the round
    const round = job.interviewRounds.find(r => r._id.toString() === roundId);
    if (!round) {
      return res.status(404).json({ message: "Round not found", success: false });
    }
    
    // Verify this is an aptitude round
    if (round.type !== 'aptitude') {
      return res.status(400).json({ message: "This round is not configured for aptitude testing", success: false });
    }

    // Format questions
    const formattedQuestions = questions.map(q => ({
      questionText: q.questionText || q.question,
      type: q.type || 'multiple-choice',
      options: Array.isArray(q.options) ? 
        (typeof q.options[0] === 'string' ? 
          q.options.map((text, index) => ({
            text,
            isCorrect: index === (q.correctOption || q.correctAnswer)
          })) :
          q.options
        ) : [],
      points: q.points || 1
    }));
    
    // Try to find existing aptitude test (first by round.aptitudeTest, then by jobId+roundId)
    let aptitudeTest = null;
    let isNewTest = false;
    
    if (round.aptitudeTest) {
      console.log(`Looking for test by ID: ${round.aptitudeTest}`);
      aptitudeTest = await AptitudeTest.findById(round.aptitudeTest).session(session);
    }
    
    if (!aptitudeTest) {
      console.log(`Looking for test by jobId: ${jobId} and roundId: ${roundId}`);
      
      // First try to find the job and get the aptitudeTest ID from the specific round
      aptitudeTest = await AptitudeTest.findOne({ 
        jobId, 
        roundId
      }).session(session);
    }
    
    if (!aptitudeTest) {
      // Create a new aptitude test
      console.log('No existing test found. Creating new test.');
      aptitudeTest = new AptitudeTest({
        title,
        description,
        duration,
        passingScore,
        questions: formattedQuestions,
        jobId,
        roundId,
        createdBy: userId
      });
      isNewTest = true;
    } else {
      // Update existing test
      console.log(`Updating existing test with ID: ${aptitudeTest._id}`);
      aptitudeTest.title = title;
      aptitudeTest.description = description;
      aptitudeTest.duration = duration;
      aptitudeTest.passingScore = passingScore;
      aptitudeTest.questions = formattedQuestions;
    }
    
    // Save the test
    await aptitudeTest.save({ session });
    
    // Always update the round to point to this test
    round.aptitudeTest = aptitudeTest._id;
    round.passingScore = passingScore;
    await job.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json({
      message: isNewTest ? "Aptitude test created successfully" : "Aptitude test updated successfully",
      aptitudeTest,
      success: true
    });
  } catch (error) {
    console.error("Error updating aptitude test:", error);
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Get job progress
export const getJobProgress = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.id;

    const job = await Job.findById(jobId)
      .populate('candidateProgress.applicant', 'fullName email profilePhoto')
      .populate('interviewRounds');

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false
      });
    }

    // Check ownership
    if (job.created_by.toString() !== userId) {
      return res.status(403).json({
        message: "You don't have permission to view this job's progress",
        success: false
      });
    }

    // Ensure aptitudeTest or aptitudeTestLink is populated in interviewRounds for frontend
    // Populate aptitudeTest field for all interviewRounds
    await job.populate({
      path: 'interviewRounds',
      populate: { path: 'aptitudeTest', select: '_id' }
    });
    // Add aptitudeTestLink if aptitudeTest exists
    job.interviewRounds = job.interviewRounds.map(round => {
      if (round.type === 'aptitude' && round.aptitudeTest && !round.aptitudeTestLink) {
        return { ...round.toObject(), aptitudeTestLink: `internal:${round.aptitudeTest._id}` };
      }
      return round.toObject ? round.toObject() : round;
    });

    return res.status(200).json({
      message: "Job progress retrieved successfully",
      job,
      success: true
    });
  } catch (error) {
    console.error("Error getting job progress:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

// Update candidate status
export const updateCandidateStatus = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;
    const { status, feedback } = req.body;
    const userId = req.id;

    // Verify job exists and user owns it
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false
      });
    }

    // Check ownership
    if (job.created_by.toString() !== userId) {
      return res.status(403).json({
        message: "You don't have permission to update this job",
        success: false
      });
    }

    // Find candidate progress
    const candidateProgress = job.candidateProgress.find(
      cp => cp.applicant.toString() === candidateId
    );

    if (!candidateProgress) {
      return res.status(404).json({
        message: "Candidate progress not found",
        success: false
      });
    }

    // Update status
    candidateProgress.overallStatus = status;
    if (feedback) {
      // Add feedback to the most recent round
      if (candidateProgress.roundsStatus.length > 0) {
        candidateProgress.roundsStatus[candidateProgress.roundsStatus.length - 1].feedback = feedback;
      }
    }
    candidateProgress.lastUpdated = new Date();

    await job.save();

    return res.status(200).json({
      message: "Candidate status updated successfully",
      candidateProgress,
      success: true
    });
  } catch (error) {
    console.error("Error updating candidate status:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

// Create default aptitude test for a round
const createDefaultAptitudeTest = async (roundId) => {
  try {
    const defaultTest = new AptitudeTest({
      title: "General Aptitude Assessment",
      description: "Basic assessment of problem-solving and analytical skills",
      timeLimit: 60, // 60 minutes
      questions: [
        {
          question: "What comes next in the sequence: 2, 4, 8, 16, __?",
          options: ["24", "32", "28", "20"],
          correctAnswer: 1, // 32
          points: 5
        },
        {
          question: "If a shirt costs $20 after a 20% discount, what was its original price?",
          options: ["$22", "$24", "$25", "$28"],
          correctAnswer: 2, // $25
          points: 5
        },
        {
          question: "Which word does NOT belong with the others? Apple, Banana, Carrot, Orange",
          options: ["Apple", "Banana", "Carrot", "Orange"],
          correctAnswer: 2, // Carrot (it's a vegetable)
          points: 5
        }
      ],
      passingScore: 10
    });

    await defaultTest.save();
    return defaultTest;
  } catch (error) {
    console.error('Error creating default test:', error);
    throw error;
  }
};

// Add a candidate to the interview pipeline for a job
export const addCandidateToProcess = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;
    const recruiterId = req.id; // Get the recruiter ID from the request

    console.log('Adding candidate to process:', { jobId, candidateId });

    const job = await Job.findById(jobId).populate('interviewRounds').populate('company');

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false
      });
    }

    // Find the first aptitude round
    const firstAptitude = job.interviewRounds.find(r => r.type === 'aptitude');
    if (!firstAptitude) {
      return res.status(400).json({ message: "No aptitude round found", success: false });
    }

    // Update or create Application
    let application = await Application.findOne({ job: jobId, applicant: candidateId });
    if (application) {
      // Using valid status enum values from Application model: 'pending', 'accepted', 'rejected'
      if (application.status === 'accepted') {
        if (!application.currentRound) {
          application.currentRound = firstAptitude._id;
        }
        if (!application.roundsStatus || application.roundsStatus.length === 0) {
          application.roundsStatus = [{
            round: firstAptitude._id,
            status: 'pending',
            feedback: '',
            updatedAt: new Date()
          }];
        }
        // Set overall status to in_progress (valid value in Application model)
        application.overallStatus = 'in_progress';
        await application.save();
      }
    }

    // Initialize candidate progress object
    const candidateProgress = {
      applicant: candidateId,
      currentRound: firstAptitude._id,
      roundsStatus: [{
        round: firstAptitude._id,
        status: 'pending',
        feedback: '',
        score: 0
      }],
      overallStatus: 'in_process', // Use 'in_process' for Job.candidateProgress
      lastUpdated: new Date()
    };

    // Add candidate to the pipeline if not already present
    const existingProgress = job.candidateProgress?.find(
      cp => cp.applicant?.toString() === candidateId?.toString()
    );

    if (!existingProgress) {
      if (!job.candidateProgress) {
        job.candidateProgress = [];
      }
      job.candidateProgress.push(candidateProgress);
      await job.save({ validateBeforeSave: false }); // Add validateBeforeSave: false to prevent validation errors

      // Update application status - use valid enum value 'accepted'
      await Application.findOneAndUpdate(
        { job: jobId, applicant: candidateId },
        { 
          status: 'accepted',  // Valid enum: 'pending', 'accepted', 'rejected'
          overallStatus: 'in_progress' // Valid enum: 'applied', 'in_progress', 'hired', 'rejected'
        }
      );

      console.log('Added candidate to pipeline:', candidateProgress);
      
      // Send notification to candidate if enabled
      try {
        // Check if recruiter has enabled sending notifications
        const recruiter = await User.findById(recruiterId);
        if (recruiter && recruiter.notificationPreferences?.sendCandidateNotifications) {
          // Check if candidate has enabled receiving notifications
          const candidate = await User.findById(candidateId);
          if (candidate && candidate.notificationPreferences?.browserNotifications) {
            // Create notification
            if (!candidate.notifications) {
              candidate.notifications = [];
            }
            
            candidate.notifications.unshift({
              message: `Your application for ${job.title} at ${job.company?.name || 'our company'} has been accepted. You've been added to the interview pipeline.`,
              type: 'success',
              isRead: false,
              time: new Date(),
              createdAt: new Date(),
              companyLogo: job.company?.logo || '',
              companyName: job.company?.name || 'Company',
              jobId: jobId
            });
            
            await candidate.save();
            console.log(`Notification sent to candidate ${candidateId} for pipeline addition`);
          }
        }
      } catch (notificationError) {
        console.error('Error sending notification to candidate:', notificationError);
        // Continue with the response even if notification fails
      }
    }

    const response = {
      message: "Candidate added to interview pipeline",
      success: true,
      progress: candidateProgress
    };

    console.log('addCandidateToProcess response:', response);

    if (res.status) {
      return res.status(200).json(response);
    }
    return response;
  } catch (error) {
    console.error('Error in addCandidateToProcess:', error);
    if (res.status) {
      return res.status(500).json({
        message: "Internal server error",
        success: false,
        error: error.message
      });
    }
    throw error;
  }
};