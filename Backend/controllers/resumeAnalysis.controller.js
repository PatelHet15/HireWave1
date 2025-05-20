// Import the Gemini Pro Vision model for advanced resume analysis
import { analyzeResumeWithVision, extractTextFromPDF } from '../utils/geminiVision.js';
import User from '../models/user.model.js';
import crypto from 'crypto';

// controllers/resumeAnalysis.controller.js
export const analyzeUserResume = async (req, res) => {
  try {
    console.log('Request user:', req.user); // Debug log
    console.log('Request body:', req.body); // Debug log
    
    // Extract user ID from JWT token or request body
    // The token might contain userId or _id depending on how it was created
    const userId = req.user?.userId || req.user?._id || req.body.userId;
    console.log('Extracted userId:', userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in request' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a resume URL
    if (!user.profile?.resume) {
      return res.status(400).json({ message: 'User does not have a resume uploaded' });
    }

    // Generate a hash of the resume URL to detect content changes
    const currentResumeHash = crypto
      .createHash('md5')
      .update(user.profile.resume || '')
      .digest('hex');

    // Check if we need to perform a new analysis
    const hasAnalysis = user.profile.resumeAnalysis && 
                       user.profile.resumeAnalysis.atsScore !== undefined &&
                       user.profile.resumeAnalysis.analyzedAt;
    
    // Check if the resume content has changed by comparing hashes
    const resumeChanged = !user.profile.resumeAnalysis?.resumeHash || 
                         user.profile.resumeAnalysis.resumeHash !== currentResumeHash;
    
    // Only analyze if:
    // 1. No previous analysis exists, OR
    // 2. Resume content has changed (different hash)
    const needsNewAnalysis = !hasAnalysis || resumeChanged;
    
    // Check if we have a valid analysis that doesn't need updating
    const hasValidAnalysis = hasAnalysis && !needsNewAnalysis;

    // If there's a valid analysis that doesn't need updating, return it
    if (hasValidAnalysis) {
      console.log('Using cached resume analysis');
      return res.status(200).json({
        message: 'Resume analysis retrieved from cache',
        analysis: user.profile.resumeAnalysis,
        isCached: true,
        lastAnalyzed: user.profile.resumeAnalysis.analyzedAt
      });
    }
    
    console.log('Performing new analysis with Gemini API...');

    // We'll use the resume URL directly with Gemini Pro Vision
    console.log('Using Gemini Pro Vision for resume analysis');
    
    // Analyze resume with Gemini Pro Vision API
    console.time('analyzeResume');
    try {
      // Pass the resume URL directly to the vision model
      const analysis = await analyzeResumeWithVision(user.profile.resume);
      console.timeEnd('analyzeResume');
      
      // No fallback - we want to use only the vision model results

      // Update user with resume analysis and hash
      user.profile.resumeAnalysis = {
        ...analysis,
        resumeHash: currentResumeHash,
        analyzedAt: new Date()
      };
      await user.save();
      
      return res.status(200).json({
        message: 'Resume analyzed successfully',
        analysis: user.profile.resumeAnalysis,
        isCached: false
      });
    } catch (error) {
      console.error('Resume analysis error:', error);
      
      // Create a basic analysis even if there's an error
      const basicAnalysis = {
        strengths: ['Resume received', 'Application processed'],
        weaknesses: ['Analysis encountered technical difficulties'],
        atsScore: 60,
        suggestions: [
          'Try analysis again later',
          'Ensure resume is properly formatted',
          'Include relevant keywords from job descriptions'
        ]
      };
      
      try {
        // Try to save the basic analysis to user profile
        if (user && user.profile) {
          user.profile.resumeAnalysis = basicAnalysis;
          await user.save();
        }
        
        // Return a 200 status with the basic analysis to ensure frontend gets a response
        return res.status(200).json({
          message: 'Basic resume analysis provided due to technical issues',
          analysis: basicAnalysis,
          isCached: false,
          error: error.message
        });
      } catch (saveError) {
        // If we can't even save the basic analysis, return a 500 error
        return res.status(500).json({ 
          message: 'Error analyzing resume and saving results',
          error: error.message,
          saveError: saveError.message
        });
      }
    }
  } catch (error) {
    console.error('Resume analysis error:', error);
    
    // Create a basic analysis even if there's an error
    const basicAnalysis = {
      strengths: ['Resume received', 'Application processed'],
      weaknesses: ['Analysis encountered technical difficulties'],
      atsScore: 60,
      suggestions: [
        'Try analysis again later',
        'Ensure resume is properly formatted',
        'Include relevant keywords from job descriptions'
      ]
    };
    
    try {
      // Try to save the basic analysis to user profile
      if (user && user.profile) {
        user.profile.resumeAnalysis = basicAnalysis;
        await user.save();
      }
      
      // Return a 200 status with the basic analysis to ensure frontend gets a response
      return res.status(200).json({
        message: 'Basic resume analysis provided due to technical issues',
        analysis: basicAnalysis,
        cached: false,
        error: error.message
      });
    } catch (saveError) {
      // If we can't even save the basic analysis, return a 500 error
      return res.status(500).json({ 
        message: 'Error analyzing resume and saving results',
        error: error.message,
        saveError: saveError.message
      });
    }
  }
};