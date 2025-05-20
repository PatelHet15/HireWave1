import mongoose from "mongoose";
import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { AptitudeTest } from "../models/aptitudeTest.model.js";
import { createTransport } from "nodemailer";
const { startSession, connect } = mongoose;


const footerLogoUrl = "https://res.cloudinary.com/dpdffedd1/image/upload/v1746942040/logo2_gyaynp.png";

// Static email configuration 
// For production use environment variables
const EMAIL_CONFIG = {
  EMAIL: "hetdpatel15113@gmail.com",  // This will appear as the sender
  NAME: "HireWave Job Portal",
  // Using console-based email delivery for development
  ENABLE_ACTUAL_EMAILS: true, // Set to true only when you have proper SMTP credentials
  LOGO_URL: "https://res.cloudinary.com/dpdffedd1/image/upload/v1746942040/logo2_gyaynp.png" // Logo for email clients
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const recruiterId = req.id;

    console.log('Updating application status:', { applicationId, status });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const application = await Application.findById(applicationId)
        .populate({
          path: 'job',
          select: 'title company interviewRounds',
          populate: [
            {
              path: 'interviewRounds',
              options: { sort: { order: 1 } }
            },
            {
              path: 'company',
              select: 'name logo'
            }
          ]
        })
        .populate('applicant', 'email fullname notificationPreferences')
        .session(session);

      if (!application) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Application not found", success: false });
      }

      application.status = status;
      await application.save({ session });
      
      // Send notifications based on user preferences
      try {
        const recruiter = await User.findById(recruiterId);
        if (recruiter && recruiter.notificationPreferences?.sendCandidateNotifications) {
          const candidate = await User.findById(application.applicant._id);
          
          if (candidate) {
            // Check browser notification preference
            if (candidate.notificationPreferences?.browserNotifications) {
            let message = '';
            let notificationType = '';
            
            if (status === 'accepted') {
              message = `Your application for ${application.job.title} at ${application.job.company?.name || 'our company'} has been accepted`;
              notificationType = 'success';
            } else if (status === 'rejected') {
              message = `We regret to inform you that your application for ${application.job.title} at ${application.job.company?.name || 'our company'} has been rejected`;
              notificationType = 'info';
            }
            
            if (message) {
                if (!candidate.notifications) {
                  candidate.notifications = [];
                }
                
                candidate.notifications.unshift({
                  message,
                  type: notificationType,
                  isRead: false,
                  time: new Date(),
                  createdAt: new Date(),
                  companyLogo: application.job.company?.logo || '',
                  companyName: application.job.company?.name || 'Company',
                  jobId: application.job._id
                });
              }
            }

            // Check email notification preferences
            if (candidate.notificationPreferences?.emailNotifications &&
                candidate.notificationPreferences?.emailNotificationTypes?.statusChanges) {
              
              const emailData = {
                to: candidate.email,
                subject: `Application Status Update - ${application.job.title}`,
                template: status === 'accepted' ? 'acceptance' : 'status_update',
                data: {
                  candidateName: candidate.fullname,
                  companyName: application.job.company?.name || 'HireWave',
                  position: application.job.title,
                  companyLogo: application.job.company?.logo,
                  message: status === 'accepted' 
                    ? `Congratulations! Your application for ${application.job.title} has been accepted.`
                    : `We regret to inform you that your application for ${application.job.title} has been rejected.`,
                  nextSteps: status === 'accepted'
                    ? 'Please check your dashboard for further instructions and next steps in the interview process.'
                    : 'Thank you for your interest. We encourage you to apply for other positions that match your skills.',
                  footerLogoUrl
                }
              };

              await sendEmail(emailData);
              }

            await candidate.save();
          }
        }
      } catch (notificationError) {
        console.error('Error sending notifications to candidate:', notificationError);
      }
      
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ message: `Application ${status} successfully`, success: true });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Status update error:', error);
    return res.status(500).json({ message: "Internal server error", success: false, error: error.message });
  }
};

// Create a development transport that logs emails to console
let transporter;

if (EMAIL_CONFIG.ENABLE_ACTUAL_EMAILS) {
  // Use actual SMTP for production
  transporter = createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: EMAIL_CONFIG.EMAIL,
      pass: process.env.EMAIL_PASSWORD || "urbg qfyy gmym fcex",
    },
    // Add DKIM configuration for better deliverability and logo display
    dkim: {
      domainName: process.env.DKIM_DOMAIN || 'hirewave.com',
      keySelector: process.env.DKIM_SELECTOR || 'default',
      privateKey: process.env.DKIM_PRIVATE_KEY || ''
    }
  });
  
  console.log("Email service: Using real SMTP transport");
} else {
  // For development - create a nodemailer transport that just logs emails
  console.log("Email service: DEVELOPMENT MODE - Emails will be logged to console only");
  
  // Custom transport that doesn't actually send emails
  transporter = {
    sendMail: (mailOptions) => {
      return new Promise((resolve) => {
        console.log("\n========== EMAIL WOULD BE SENT ==========");
        console.log("From:", mailOptions.from);
        console.log("To:", mailOptions.to);
        console.log("Subject:", mailOptions.subject);
        console.log("HTML Body:", mailOptions.html ? "Yes (HTML Content)" : "No");
        console.log("=======================================\n");
        
        resolve({
          messageId: `dev-${Date.now()}@localhost`,
          envelope: {
            from: mailOptions.from,
            to: [mailOptions.to]
          }
        });
      });
    }
  };
}

// handle job applications in a job portal system
export const applyJob = async (req, res) => {
  try {
    const userId = req.id;
    const jobId = req.params.id;

    console.log('Applying for job:', { userId, jobId });

    // Validate inputs
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      console.log('Invalid job ID');
      return res.status(400).json({ message: "Invalid Job ID", success: false });
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find job with interview rounds and convert to mongoose document while preserving _id
      const job = await Job.findById(jobId).populate('interviewRounds').session(session);
      if (!job) {
        console.log('Job not found:', jobId);
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Job not found", success: false });
      }
      
      console.log('Found job with interview rounds:', {
        jobId: job._id,
        roundsCount: job.interviewRounds?.length || 0
      });

      // Check if user has already applied
      const existingApplication = await Application.findOne({
        applicant: userId,
        job: jobId
      }).session(session);

      if (existingApplication) {
        console.log('User already applied:', { userId, jobId });
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Already applied to this job", success: false });
      }

      // Create new application
      const application = new Application({
        applicant: userId,
        job: jobId,
        status: 'pending',
        appliedAt: new Date()
      });

      console.log('Creating new application:', application);

      // Save application
      const savedApplication = await application.save({ session });
      console.log('Application saved:', savedApplication._id);

      // Update job's applications array
      job.applications = job.applications || [];
      job.applications.push(savedApplication._id);
      
      await job.save({ session });
      console.log('Job updated with new application:', {
        applicationId: savedApplication._id,
        applicationsCount: job.applications.length
      });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      console.log('Transaction committed successfully');

      // Send success response
      return res.status(201).json({
        message: "Successfully applied to job",
        success: true,
        application
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Error in applyJob:', error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message
    });
  }
};


// retrieves all jobs a user has applied for
// In application.controller.js
export const getAppliedJobs = async (req, res) => {
  try {
    // Get user ID from request or from query parameter (for admin viewing candidate applications)
    const userId = req.query.candidateId || req.id;
    
    console.log('Getting applications for user:', userId);

    // Validate that the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    // If admin is viewing another user's applications, check permissions
    if (req.query.candidateId && req.id !== req.query.candidateId) {
      const requestingUser = await User.findById(req.id);
      if (!requestingUser) {
        return res.status(403).json({
          message: "User not found",
          success: false
        });
      }
      
      // Allow admin users to view any candidate's applications
      if (requestingUser.role !== 'admin' && requestingUser.role !== 'recruiter') {
        return res.status(403).json({
          message: "Not authorized to view other users' applications",
          success: false
        });
      }
      
      console.log(`Admin user ${req.id} viewing applications for candidate ${req.query.candidateId}`);
    }

    // Find all applications for the user
    const applications = await Application.find({ applicant: userId })
      .populate({
        path: "job",
        select: "title company jobType position experienceLevel salary jobLocation",
        populate: {
          path: "company",
          select: "name logo"
        }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Applied jobs retrieved successfully",
      applications,
      success: true
    });
  } catch (error) {
    console.error("Error getting applied jobs:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

// admin can see how many users haved applied
// admin dekhega kitna user ne apply kiya hai
export const getApplicants = async (req, res) => {
  try {
    const jobId = req.params.id;
    
    const job = await Job.findById(jobId)
      .populate({
        path: 'applications',
        populate: [
          {
            path: 'applicant',
            select: 'fullname email profile',
            populate: {
              path: 'profile',
              select: 'profilePhoto skills'
            }
          },
          {
            path: 'job',
            select: 'title jobType'
          }
        ]
      })
      .lean();

    if (!job) {
      return res.status(404).json({
        message: 'Job not found',
        success: false
      });
    }

    if (!job) {
      return res.status(404).json({
        message: 'Job not found',
        success: false
      });
    }

    // Transform data for easier frontend consumption
    const applicants = (job.applications || []).map(app => ({
      _id: app._id,
      status: app.status,
      currentStage: app.currentStage,
      createdAt: app.createdAt,
      applicant: {
        _id: app.applicant._id,
        fullname: app.applicant.fullname,
        email: app.applicant.email,
        profilePhoto: app.applicant.profile?.profilePhoto,
        skills: app.applicant.profile?.skills || []
      },
      job: {
        _id: app.job._id,
        title: app.job.title,
        jobType: app.job.jobType
      }
    }));

    return res.status(200).json({
      success: true,
      applicants  // Changed from 'job' to 'applicants' for clarity
    });
  } catch (error) {
    console.error('Error fetching applicants:', error);
    return res.status(500).json({
      message: 'Error fetching applicants',
      success: false
    });
  }
};

// Send email notification with fallback to console
const sendEmail = async (emailData) => {
  try {
    const { to, subject, template, data } = emailData;
    
    // Ensure we have a valid company logo URL
    if (data.companyLogoUrl && data.companyLogoUrl.startsWith('http')) {
      console.log('Company logo fetched successfully');
    } else {
      console.log('No valid company logo URL provided');
      data.companyLogoUrl = null;
    }
    
    // We're no longer using companyProfilePic for logo display
    
    let htmlContent = '';
    if (template === 'acceptance') {
      htmlContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <!-- Header with Logo -->
          <div style="background-color: #1a56db; padding: 20px; text-align: center;">
            ${data.companyLogoUrl ? 
              `<div style="margin-bottom: 15px;">
                <!-- Company logo image -->
                <img src="${data.companyLogoUrl}" alt="${data.companyName}" width="200" height="80" style="display: inline-block; max-width: 200px; max-height: 80px; object-fit: contain;" referrerpolicy="no-referrer" crossorigin="anonymous">
              </div>` : 
              `<h2 style="color: white; margin: 0; font-size: 24px;">${data.companyName || 'HireWave'}</h2>`
            }
            <h1 style="color: white; margin: 10px 0 0 0; font-weight: 500; font-size: 22px;">Application Accepted</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 25px; background-color: white;">
            <p style="font-size: 16px; color: #333; margin-top: 0;">Hi ${data.candidateName},</p>
            <p style="font-size: 16px; color: #333;">Congratulations! You've been selected for <strong>${data.position}</strong> at ${data.companyName}.</p>
            
            <div style="background-color: #f0f6ff; border-radius: 6px; padding: 15px; margin: 20px 0; border-left: 4px solid #1a56db;">
              <p style="margin: 0; color: #2563eb;"><strong>What's Next?</strong></p>
              <p style="margin-top: 8px; margin-bottom: 0; color: #4b5563;">${data.nextSteps}</p>
            </div>
            
            <!-- Company Details -->
            <table style="width: 100%; margin: 25px 0; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; color: #6b7280; width: 120px;">Company</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: 500;">${data.companyName}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; color: #6b7280;">Location</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${data.companyAddress || 'Will be provided'}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; color: #6b7280;">Contact</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${data.contactEmail || EMAIL_CONFIG.EMAIL}</td>
              </tr>
            </table>

            <p style="font-size: 14px; color: #6b7280; margin-top: 25px; border-top: 1px solid #e5e5e5; padding-top: 20px;">
              <strong>Note:</strong> This offer is subject to verification and company policies. Please check your profile for more details.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <img src="${data.footerLogoUrl}" alt="HireWave" style="height: 50px; width: auto; margin-bottom: 15px;" referrerpolicy="no-referrer" crossorigin="anonymous">
            <p style="margin: 0; color: #64748b; font-size: 14px;">This is an automated email from ${data.companyName || 'HireWave'}.</p>
            <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">&copy; ${new Date().getFullYear()} ${data.companyName || 'HireWave'}. All rights reserved.</p>
          </div>
        </div>
      `;
    } else {
      htmlContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <!-- Header with Logo -->
          <div style="background-color: #3b82f6; padding: 20px; text-align: center;">
            ${data.companyLogoUrl ? 
              `<div style="margin-bottom: 15px;">
                <!-- Company logo image -->
                <img src="${data.companyLogoUrl}" alt="${data.companyName}" width="200" height="80" style="display: inline-block; max-width: 200px; max-height: 80px; object-fit: contain;" referrerpolicy="no-referrer" crossorigin="anonymous">
              </div>` : 
              `<h2 style="color: white; margin: 0; font-size: 24px;">${data.companyName || 'HireWave'}</h2>`
            }
            <h1 style="color: white; margin: 10px 0 0 0; font-weight: 500; font-size: 22px;">Application Status Update</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 25px; background-color: white;">
            <p style="font-size: 16px; color: #333; margin-top: 0;">Hi ${data.candidateName},</p>
            <p style="font-size: 16px; color: #333;">${data.message}</p>
            
            <div style="background-color: #f0f6ff; border-radius: 6px; padding: 15px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <p style="margin: 0 0 8px 0; color: #2563eb;"><strong>Feedback</strong></p>
              <p style="margin: 0; color: #4b5563;">Thank you for your interest. ${data.nextSteps}</p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 25px; border-top: 1px solid #e5e5e5; padding-top: 20px;">
              Best regards,<br>
              <strong>${data.companyName}</strong> Recruitment Team
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <img src="${data.footerLogoUrl}" alt="HireWave" style="height: 50px; width: auto; margin-bottom: 15px;" referrerpolicy="no-referrer" crossorigin="anonymous">
            <p style="margin: 0; color: #64748b; font-size: 14px;">This is an automated email from ${data.companyName || 'HireWave'}.</p>
            <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">&copy; ${new Date().getFullYear()} ${data.companyName || 'HireWave'}. All rights reserved.</p>
          </div>
        </div>
      `;
    }

    // Set companyLogoUrl explicitly for the email template
    data.companyLogoUrl = data.companyLogo;
    
    // Clear any relative path profile pics
    if (data.companyProfilePic && !data.companyProfilePic.startsWith('http')) {
      console.log('Removing relative path profile pic:', data.companyProfilePic);
      data.companyProfilePic = null;
    }
    
    // Prepare email with company logo
    console.log('Preparing email with template:', template);
    if (data.companyLogoUrl) {
      console.log('Using company logo:', data.companyLogoUrl);
    }
    
    // Send the email
    const info = await transporter.sendMail({
      from: {
        name: EMAIL_CONFIG.NAME,
        address: EMAIL_CONFIG.EMAIL
      },
      to,
      subject,
      html: htmlContent
    });
    
    console.log(`Email ${EMAIL_CONFIG.ENABLE_ACTUAL_EMAILS ? 'sent' : 'simulated'} for: ${to}`);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return true; // Return true anyway to continue the application flow
  }
};

// Add notification to user with error handling
const addNotification = async (userId, notification) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('Notification error: User not found', userId);
      return false;
    }

    if (!user.notifications) {
      user.notifications = [];
    }

    // Ensure notification has all required fields
    const completeNotification = {
      ...notification,
      isRead: false,
      createdAt: new Date(),
      time: new Date()  // Adding both for backward compatibility
    };

    user.notifications.unshift(completeNotification);
    console.log('Adding notification to user:', userId);
    console.log('Notification data:', completeNotification);

    await user.save();
    return true;
  } catch (error) {
    console.error('Notification error:', error);
    return false;
  }
};

// Send notification to candidate when added to pipeline
export const notifyCandidate = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        select: 'title company jobLocation',
        populate: {
          path: 'company',
          select: 'name logo location userId'
        }
      })
      .populate('applicant', 'email name notificationPreferences');

    if (!application) {
      return res.status(404).json({ message: "Application not found", success: false });
    }

    // Check if candidate has enabled email notifications
    if (!application.applicant.notificationPreferences?.emailNotifications) {
      console.log('Email notifications disabled for candidate:', application.applicant.email);
      return res.status(200).json({ 
        message: "Notification skipped - candidate has disabled email notifications", 
        success: true,
        skipped: true
      });
    }

    // Get company logo if available
    let companyLogo = null;
    let companyName = application.job.company.name || 'HireWave';
    let companyLocation = application.job.jobLocation || 'Remote';
    let companyEmail = 'contact@hirewave.com';
    
    // Get company logo from company data - ensure it's a Cloudinary URL
    if (application.job.company) {
      if (application.job.company.logo && application.job.company.logo.trim() !== '') {
        // Only use if it's a Cloudinary URL
        if (application.job.company.logo.includes('cloudinary.com')) {
          companyLogo = application.job.company.logo;
          console.log('Using company logo from company data:', companyLogo);
        }
      }
      
      // Get company location if available
      if (application.job.company.location && application.job.company.location.trim() !== '') {
        companyLocation = application.job.company.location;
      }
      
      // Try to get company email if userId is available
      if (application.job.company.userId) {
        try {
          const companyUser = await User.findById(application.job.company.userId);
          if (companyUser && companyUser.email) {
            companyEmail = companyUser.email;
          }
        } catch (err) {
          console.log('Error fetching company user email:', err);
        }
      }
    }
    
    // If still no logo, try to find the company in the User model
    if (!companyLogo) {
      try {
        const companyUser = await User.findOne({ 
          role: 'company', 
          'profile.companyName': companyName 
        });
        
        if (companyUser && companyUser.profile && companyUser.profile.profilePhoto) {
          // Only use if it's an absolute URL (preferably Cloudinary)
          if (companyUser.profile.profilePhoto.startsWith('http')) {
            companyLogo = companyUser.profile.profilePhoto;
            console.log('Found company logo from user profile:', companyLogo);
          } else {
            console.log('Skipping relative path profile pic:', companyUser.profile.profilePhoto);
            // Try to find the company in the Company model instead
            try {
              const { Company } = await import('../models/company.model.js');
              const companyRecord = await Company.findOne({ name: companyName });
              
              if (companyRecord && companyRecord.logo && companyRecord.logo.startsWith('http')) {
                companyLogo = companyRecord.logo;
                console.log('Found company logo from Company model:', companyLogo);
              }
            } catch (err) {
              console.log('Error fetching from Company model:', err);
            }
          }
        }
      } catch (err) {
        console.log('Error fetching company user:', err);
      }
    }
    
    // Try to find the company directly in the Company model
    if (!companyLogo) {
      try {
        const { Company } = await import('../models/company.model.js');
        const companyRecord = await Company.findOne({ name: companyName });
        
        if (companyRecord && companyRecord.logo && companyRecord.logo.includes('cloudinary.com')) {
          companyLogo = companyRecord.logo;
          console.log('Found company logo from Company model:', companyLogo);
        }
      } catch (err) {
        console.log('Error fetching from Company model:', err);
      }
    }
    
    // Remove any default images - only use actual company logos
    if (companyLogo && (companyLogo.includes('default') || companyLogo.includes('placeholder'))) {
      companyLogo = null;
    }
    
    // Simple log for company logo
    console.log(companyLogo ? 'Company logo fetched successfully' : 'No company logo available');
    
    // Try to find the company in the Company model if we still don't have a logo
    if (!companyLogo && companyName) {
      try {
        const { Company } = await import('../models/company.model.js');
        const companyRecord = await Company.findOne({ name: companyName });
        
        if (companyRecord && companyRecord.logo && companyRecord.logo.startsWith('http')) {
          companyLogo = companyRecord.logo;
          console.log('Found company logo from Company model:', companyLogo);
        }
      } catch (err) {
        console.log('Error fetching from Company model:', err);
      }
    }
    
    // Ensure company logo is valid before using it
    
    // Set the footer logo URL
    const footerLogoUrl = 'https://res.cloudinary.com/dpdffedd1/image/upload/v1746942040/logo2_gyaynp.png';
    
    // Send email notification using the template
    const emailData = {
      to: application.applicant.email,
      subject: 'Application Status Update - Added to Interview Pipeline',
      template: 'acceptance',
      data: {
        candidateName: application.applicant.name,
        companyName: companyName,
        position: application.job.title,
        companyLogo: companyLogo,
        companyLogoUrl: companyLogo, // Explicitly set companyLogoUrl
        hasCompanyLogo: !!companyLogo,
        footerLogoUrl: footerLogoUrl,
        nextSteps: 'You have been added to the interview pipeline. Please check your dashboard for the next steps.',
        companyAddress: companyLocation,
        contactEmail: companyEmail,
        message: `Congratulations! You've been selected for ${application.job.title} at ${companyName}.`
      }
    };
    
    // Log the final email data
    console.log('Final email data:', {
      companyName: emailData.data.companyName,
      hasCompanyLogo: emailData.data.hasCompanyLogo,
      companyLogoUrl: emailData.data.companyLogoUrl || 'Not provided'
    });

    await sendEmail(emailData);

    // Add notification
    await addNotification(application.applicant._id, {
      title: 'Application Accepted',
      message: `Your application for ${application.job.title} has been accepted. Check your dashboard for next steps.`,
      type: 'success'
    });

    return res.status(200).json({ 
      message: "Notification sent successfully", 
      success: true 
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ 
      message: "Error sending notification", 
      error: error.message,
      success: false 
    });
  }
};

export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const recruiterId = req.id; // Get the recruiter ID from the request

  try {
    // Validate status value
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: "Invalid status value. Must be 'accepted' or 'rejected'",
        success: false
      });
    }

    const application = await Application.findById(id)
      .populate({
        path: 'job',
        select: 'title company',
        populate: {
          path: 'company',
          select: 'name logo'
        }
      })
      .populate('applicant', 'email fullname notificationPreferences');

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
        success: false
      });
    }

    application.status = status;
    await application.save();

    // Send notification to candidate if enabled
    try {
      // Check if recruiter has enabled sending notifications
      const recruiter = await User.findById(recruiterId);
      if (recruiter && recruiter.notificationPreferences?.sendCandidateNotifications) {
        // Check if candidate has enabled receiving notifications
        if (application.applicant && application.applicant.notificationPreferences?.browserNotifications) {
          // Create notification message based on status
          let message = '';
          let notificationType = '';
          
          if (status === 'accepted') {
            message = `Your application for ${application.job.title} at ${application.job.company?.name || 'our company'} has been accepted`;
            notificationType = 'success';
          } else if (status === 'rejected') {
            message = `We regret to inform you that your application for ${application.job.title} at ${application.job.company?.name || 'our company'} has been rejected`;
            notificationType = 'info';
          }
          
          if (message) {
            // Get the candidate
            const candidate = await User.findById(application.applicant._id);
            if (candidate) {
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
                companyLogo: application.job.company?.logo || '',
                companyName: application.job.company?.name || 'Company',
                jobId: application.job._id
              });
              
              await candidate.save();
              console.log(`Notification sent to candidate ${application.applicant._id} for ${status} status`);
            }
          }
        }
      }
    } catch (notificationError) {
      console.error('Error sending notification to candidate:', notificationError);
      // Continue with the response even if notification fails
    }

    return res.status(200).json({
      message: `Application ${status} successfully`,
      success: true
    });
  } catch (error) {
    console.error('Status update error:', error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message
    });
  }
};

// Get application progress details for a candidate
export const getApplicationProgress = async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;
    const candidateId = req.id;
    
    let application;
    
    if (applicationId) {
      // If applicationId is provided, find by applicationId and populate job
      application = await Application.findById(applicationId)
        .populate({
          path: 'job',
          populate: [
            { path: 'company', select: 'name logo' },
            { path: 'interviewRounds' }
          ]
        });
    } else if (jobId) {
      // If jobId is provided, find by jobId and candidateId
      application = await Application.findOne({
        job: jobId,
        applicant: candidateId
      }).populate({
        path: 'job',
        populate: [
          { path: 'company', select: 'name logo' },
          { path: 'interviewRounds' }
        ]
      });
    } else {
      return res.status(400).json({
        message: "Missing jobId or applicationId",
        success: false
      });
    }

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
        success: false
      });
    }

    // Prepare progress data
    const job = application.job;
    if (!job) {
      return res.status(404).json({
        message: "Job not found in application",
        success: false
      });
    }

    // If application is not accepted or in_process, return basic information
    if (application.status !== 'accepted' && application.status !== 'in_process') {
      return res.status(200).json({
        message: "Application found",
        success: true,
        progress: {
          status: application.status,
          applied: application.createdAt,
          lastUpdated: application.updatedAt,
          job: job // Always include job object for frontend
        }
      });
    }

    // Check if candidate is in the job's interview pipeline
    const candidateProgress = job.candidateProgress?.find(
      (progress) => {
        // Support both .candidate and .applicant for robustness
        const candidateField = progress.candidate || progress.applicant;
        return candidateField?.toString() === candidateId;
      }
    );

    // Prepare the progress response
    let progressData = {
      status: application.status,
      applied: application.createdAt,
      lastUpdated: application.updatedAt,
      job: {
        _id: job._id,
        title: job.title,
        company: job.company,
        interviewRounds: job.interviewRounds
      }
    };

    if (candidateProgress) {
      progressData.currentRound = candidateProgress.currentRound;
      progressData.roundsStatus = candidateProgress.roundsStatus;

      // Check if there's a scheduled interview
      const scheduledInterview = candidateProgress.roundsStatus.find(
        rs => rs.status === 'scheduled' && rs.scheduledDateTime
      );

      const roundsCompleted = candidateProgress.roundsStatus.filter(rs => rs.status === 'completed').length;
      const currentRound = job.interviewRounds.find(r => r._id.toString() === candidateProgress.currentRound.toString());

      progressData = {
        ...progressData,
        currentRound: currentRound ? {
          id: currentRound._id,
          name: currentRound.name,
          type: currentRound.type,
          order: currentRound.order
        } : null,
        overallStatus: candidateProgress.overallStatus,
        roundsCompleted,
        nextInterviewDate: scheduledInterview?.scheduledDateTime || null,
        completed: candidateProgress.overallStatus === 'hired' || candidateProgress.overallStatus === 'rejected',
        roundsData: candidateProgress.roundsStatus.map(rs => {
          const round = job.interviewRounds.find(r => r._id.toString() === rs.round.toString());
          return {
            roundId: rs.round,
            status: rs.status,
            score: rs.score,
            feedback: rs.feedback,
            completedAt: rs.completedAt,
            scheduledDateTime: rs.scheduledDateTime,
            name: round?.name || 'Unknown Round',
            type: round?.type || 'unknown',
            order: round?.order || 0
          };
        }).sort((a, b) => a.order - b.order)
      };
    }
    
    return res.status(200).json({
      message: "Application progress retrieved successfully",
      success: true,
      progress: progressData
    });
    
  } catch (error) {
    console.error("Error getting application progress:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message
    });
  }
};

// In application.controller.js
export const checkApplication = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const userId = req.id;

    console.log('Checking application for job:', jobId, 'and user:', userId);

    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: userId
    }).populate('job');

    if (!existingApplication) {
      return res.status(200).json({
        hasApplied: false,
        success: true
      });
    }

    console.log('Found application:', existingApplication);

    return res.status(200).json({
      hasApplied: true,
      application: existingApplication,
      success: true
    });
  } catch (error) {
    console.error('Error checking application:', error);
    res.status(500).json({
      message: "Error checking application status",
      success: false
    });
  }
};