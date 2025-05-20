import { User } from "../models/user.model.js";
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import nodemailer from "nodemailer";

// Get the directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the logo URL - using a public URL that will be accessible in emails
const footerLogoUrl = 'https://res.cloudinary.com/dpdffedd1/image/upload/v1746942040/logo2_gyaynp.png'; // Default footer logo

// Static email configuration 
// For production use environment variables
const EMAIL_CONFIG = {
  EMAIL: "hetdpatel15113@gmail.com",  // This will appear as the sender
  NAME: "HireWave Job Portal",
  // Using console-based email delivery for development
  ENABLE_ACTUAL_EMAILS: true, // Set to true only when you have proper SMTP credentials
  LOGO_URL: "https://res.cloudinary.com/dpdffedd1/image/upload/v1746942040/logo2_gyaynp.png" // Logo for email clients
};

// Create a development transport that logs emails to console
let transporter;

if (EMAIL_CONFIG.ENABLE_ACTUAL_EMAILS) {
  // Use actual SMTP for production
  transporter = nodemailer.createTransport({
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

export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body;

    // Check if all fields are provided
    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }

    // Check if the user already exists
    const user = await User.findOne({ email }).exec();
    if (user) {
      return res.status(400).json({
        message: "User already exists with this email",
        success: false,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database
    await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      profile: {
        profilePhoto: "", // Leave it empty or set a default URL
      },
    });

    // Send success response
    return res.status(201).json({
      message: "Account created successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Something is missing",
        success: false
      });
    };
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Incorrect email or password.",
        success: false,
      })
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect email or password.",
        success: false,
      })
    };
    // check role is correct or not
    if (role !== user.role) {
      return res.status(400).json({
        message: "Account doesn't exist with current role.",
        success: false
      })
    };

    const tokenData = {
      userId: user._id,
      role: user.role // Include role in token payload
    }
    const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile
    }

    // Return token in response body instead of cookie
    return res.status(200).json({
      message: `Welcome back ${user.fullname}`,
      user,
      token, // Send token in response
      success: true
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error during login",
      success: false
    });
  }
}

export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully.",
      success: true
    })
  } catch (error) {
    console.log(error);
  }
}

export const updateProfile = async (req, res) => {
  try {
    const {
      fullname,
      email,
      phoneNumber,
      bio,
      skills,
      location,
      courseField,
      courseName,
      dob,
      gender,
      preferredLocation,
      jobType,
      preferredRole,
      collegeName,
      collegeYear,
      twelfthSchool,
      twelfthYear,
      twelfthPercentage,
      tenthSchool,
      tenthYear,
      tenthPercentage,
      internships,
      projects,
      employmentHistory
    } = req.body;

    const profilePhotoFile = req.files?.profilePhoto?.[0];
    const resumeFile = req.files?.resume?.[0];

    let skillsArray;
    if (skills) {
      skillsArray = skills.split(",");
    }

    const userId = req.id; // Authentication Middleware
    let user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    // Updating User Data
    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio) user.profile.bio = bio;
    if (location) user.profile.location = location;
    if (skills) user.profile.skills = skillsArray;
    if (courseField) user.profile.courseField = courseField;
    if (courseName) user.profile.courseName = courseName;
    if (dob) user.profile.dob = new Date(dob);
    if (gender) user.profile.gender = gender;

    // New fields
    if (preferredLocation) user.profile.preferredLocation = preferredLocation;
    if (jobType) user.profile.jobType = jobType;
    if (preferredRole) user.profile.preferredRole = preferredRole;

    // Education
    if (collegeName) user.profile.collegeName = collegeName;
    if (collegeYear) user.profile.collegeYear = collegeYear;
    if (twelfthSchool) user.profile.twelfthSchool = twelfthSchool;
    if (twelfthYear) user.profile.twelfthYear = twelfthYear;
    if (twelfthPercentage) user.profile.twelfthPercentage = twelfthPercentage;
    if (tenthSchool) user.profile.tenthSchool = tenthSchool;
    if (tenthYear) user.profile.tenthYear = tenthYear;
    if (tenthPercentage) user.profile.tenthPercentage = tenthPercentage;

    // Arrays
    if (internships) user.profile.internships = JSON.parse(internships);
    if (projects) user.profile.projects = JSON.parse(projects);
    if (employmentHistory) user.profile.employmentHistory = JSON.parse(employmentHistory);

    // Profile Picture Upload
    if (profilePhotoFile) {
      const fileUri = getDataUri(profilePhotoFile);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
      user.profile.profilePhoto = cloudResponse.secure_url;
    }

    // Resume Upload
    if (resumeFile) {
      const fileUri = getDataUri(resumeFile);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
      user.profile.resume = cloudResponse.secure_url;
      user.profile.resumeOriginalName = resumeFile.originalname;
      user.profile.resumeUpdatedAt = new Date(); // Track when resume was updated

      // Clear previous analysis when resume is updated
      if (user.profile.resumeAnalysis) {
        user.profile.resumeAnalysis.resumeHash = null;
      }
    }

    // Save Changes
    await user.save();

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

// Send email to a user
export const sendEmailNotification = async (req, res) => {
  try {
    const { to, subject, template, data } = req.body;

    // First check if the recipient has enabled email notifications
    const recipient = await User.findOne({ email: to });
    if (!recipient || !recipient.notificationPreferences?.emailNotifications) {
      return res.status(200).json({
        message: "Email notification skipped - recipient has disabled email notifications",
        success: true,
        skipped: true
      });
    }

    if (!to || !subject || !template || !data) {
      return res.status(400).json({
        message: "Missing required email data",
        success: false
      });
    }
    
    // If company data is provided but no logo, try to fetch it
    if (data.companyId && (!data.companyLogoUrl || data.companyLogoUrl.trim() === '')) {
      try {
        // First try to find the company in the User model (company accounts)
        const companyUser = await User.findOne({ 
          $or: [
            { _id: data.companyId, role: 'company' },
            { 'profile.companyId': data.companyId, role: 'company' }
          ]
        });
        
        if (companyUser && companyUser.profile) {
          // Try to get logo from profile photo
          if (companyUser.profile.profilePhoto && companyUser.profile.profilePhoto.trim() !== '' && companyUser.profile.profilePhoto.startsWith('http')) {
            data.companyLogoUrl = companyUser.profile.profilePhoto;
            console.log('Company logo fetched successfully from user profile');
          }
        }
      } catch (err) {
        console.error('Error fetching company logo:', err);
      }
    }
    
    // Ensure we have a valid company logo URL
    if (data.companyLogoUrl && data.companyLogoUrl.startsWith('http')) {
      console.log('Using company logo URL:', data.companyLogoUrl);
    } else {
      console.log('No valid company logo URL available');
      data.companyLogoUrl = null;
    }

    // Try to find the company in the Company model if we still don't have a logo
    if ((!data.companyLogoUrl || !data.companyLogoUrl.startsWith('http')) && data.companyName) {
      try {
        const { Company } = await import('../models/company.model.js');
        const companyRecord = await Company.findOne({ name: data.companyName });
        
        if (companyRecord && companyRecord.logo && companyRecord.logo.startsWith('http')) {
          data.companyLogoUrl = companyRecord.logo;
          data.companyLogo = companyRecord.logo;
          console.log('Found company logo from Company model:', data.companyLogoUrl);
        }
      } catch (err) {
        console.error('Error fetching from Company model:', err);
      }
    }
    
    // Final check to ensure we have a valid logo URL
    if (data.companyLogoUrl && data.companyLogoUrl.startsWith('http')) {
      console.log('Using company logo URL for email template:', data.companyLogoUrl);
    }

    let htmlContent = '';
    if (template === 'acceptance') {
      htmlContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
                <!-- Header with Logo -->
                <div style="background: linear-gradient(135deg, ${data.headerColor || '#3b82f6'} 0%, ${data.headerColor ? data.headerColor + '99' : '#60a5fa'} 100%); padding: 25px; text-align: center;">
                ${data.companyLogoUrl ? 
                  `<div style="margin-bottom: 15px;">
                    <a href="${data.companyLogoUrl}" target="_blank" style="display: inline-block;">
                      <img src="${data.companyLogoUrl}" alt="${data.companyName}" width="200" height="80" style="display: inline-block; max-width: 200px; max-height: 80px; object-fit: contain;" referrerpolicy="no-referrer" crossorigin="anonymous">
                    </a>
                  </div>` : 
                  `<h2 style="color: white; margin: 0; font-size: 24px;">${data.companyName || 'HireWave'}</h2>`
                }
    <h1 style="color: white; margin: 10px 0 0 0; font-weight: 500; font-size: 24px;">${data.roundName ? `${data.roundName} Passed` : 'Application Accepted'}</h1>
</div>
                
                <!-- Content -->
                <div style="padding: 35px 30px; background-color: white;">
                    <p style="font-size: 16px; color: #333; margin-top: 0;">Hi ${data.candidateName},</p>
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">${data.message}</p>
                    
                    <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                        <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: 600; font-size: 17px;">What's Next?</p>
                        <p style="margin: 0; color: #334155; line-height: 1.6;">${data.nextSteps}</p>
                    </div>
                    
                    <!-- Company Details -->
                    <table style="width: 100%; margin: 25px 0; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <tr style="background-color: #f8fafc;">
                            <td colspan="2" style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                                <h3 style="margin: 0; color: #334155; font-size: 18px;">Company Details</h3>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 120px; font-weight: 500;">Company</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${data.companyName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Position</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">${data.position}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Location</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">${data.companyAddress || 'Remote / To be determined'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Contact</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">
                                <a href="mailto:${data.contactEmail || EMAIL_CONFIG.EMAIL}" style="color: #2563eb; text-decoration: none;">${data.contactEmail || EMAIL_CONFIG.EMAIL}</a>
                            </td>
                        </tr>
                    </table>

            ${data.termsAndConditions && data.termsAndConditions.length > 0 ? `
            <!-- Terms and Conditions -->
            <div style="margin: 25px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; color: #334155; font-size: 18px;">Important Information</h3>
              <ul style="padding-left: 20px; margin: 15px 0 0 0;">
                ${data.termsAndConditions.map(term => `<li style="margin-bottom: 10px; color: #334155;">${term}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            ${data.feedback ? `
            <!-- Feedback Section -->
            <div style="margin: 25px 0; padding: 20px; background-color: #fef9c3; border-radius: 8px; border: 1px solid #fde047;">
              <h3 style="margin-top: 0; color: #854d0e; font-size: 18px;">Feedback</h3>
              <p style="margin: 10px 0 0 0; color: #854d0e; line-height: 1.6;">${data.feedback}</p>
            </div>
            ` : ''}

            <p style="font-size: 16px; color: #334155; margin-top: 25px;">
              We look forward to your continued participation in our recruitment process.
            </p>
            
            <p style="font-size: 16px; color: #334155; margin-bottom: 0;">
              Best regards,<br>
              <strong>The ${data.companyName} Recruitment Team</strong>
            </p>
          </div>
          
          <!-- Footer -->
<div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
   <img src="https://res.cloudinary.com/dpdffedd1/image/upload/v1746942040/logo2_gyaynp.png" alt="HireWave" style="height: 50px; width: auto; margin-bottom: 15px;" referrerpolicy="no-referrer" crossorigin="anonymous">
    <p style="margin: 0; color: #64748b; font-size: 14px;">This is an automated email from HireWave.</p>
    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">© ${new Date().getFullYear()} HireWave. All rights reserved.</p>
</div>
        </div>
      `;
    } else if (template === 'hired') {
      htmlContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #047857, #10b981); padding: 25px; text-align: center;">
          ${data.companyLogoUrl ? 
            `<div style="margin-bottom: 15px;">
              <img src="${data.companyLogoUrl}" alt="${data.companyName}" width="200" height="80" style="display: inline-block; max-width: 200px; max-height: 80px; object-fit: contain;" referrerpolicy="no-referrer" crossorigin="anonymous">
            </div>` : 
            `<h2 style="color: white; margin: 0; font-size: 24px;">${data.companyName || 'HireWave'}</h2>`
          }
            <h1 style="color: white; margin: 10px 0 0 0; font-weight: 500; font-size: 24px;">Congratulations! Job Offer</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 35px 30px; background-color: white;">
            <p style="font-size: 16px; color: #333; margin-top: 0;">Dear ${data.candidateName},</p>
            
            <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="margin: 0 0 10px 0; color: #047857; font-weight: 600; font-size: 18px;">Congratulations!</p>
              <p style="margin: 0; color: #064e3b; line-height: 1.6;">${data.message}</p>
            </div>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">We are excited to welcome you to our team and look forward to your contributions.</p>
            
            <!-- Job Details -->
            <table style="width: 100%; margin: 25px 0; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <tr style="background-color: #f8fafc;">
                <td colspan="2" style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                  <h3 style="margin: 0; color: #334155; font-size: 18px;">Job Details</h3>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 120px; font-weight: 500;">Position</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${data.position}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Company</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">${data.companyName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Location</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">${data.companyAddress || 'Remote / To be determined'}</td>
              </tr>
            </table>
            
            <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #3b82f6;">
              <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: 600; font-size: 17px;">Next Steps</p>
              <p style="margin: 0; color: #334155; line-height: 1.6;">${data.nextSteps}</p>
            </div>

            ${data.termsAndConditions && data.termsAndConditions.length > 0 ? `
            <!-- Terms and Conditions -->
            <div style="margin: 25px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; color: #334155; font-size: 18px;">Important Information</h3>
              <ul style="padding-left: 20px; margin: 15px 0 0 0;">
                ${data.termsAndConditions.map(term => `<li style="margin-bottom: 10px; color: #334155;">${term}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            <p style="font-size: 16px; color: #334155; margin-top: 25px;">
              Once again, congratulations on your new position! We are thrilled to have you join our team.
            </p>
            
            <p style="font-size: 16px; color: #334155; margin-bottom: 0;">
              Best regards,<br>
              <strong>The ${data.companyName} HR Team</strong>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
           <a href="${footerLogoUrl}" target="_blank" style="display: inline-block;">
             <img src="${footerLogoUrl}" alt="HireWave" height="50" style="height: 50px; width: auto; margin-bottom: 15px;" referrerpolicy="no-referrer" crossorigin="anonymous">
           </a>
    <p style="margin: 0; color: #64748b; font-size: 14px;">This is an automated email from HireWave.</p>
    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">© ${new Date().getFullYear()} HireWave. All rights reserved.</p>
          </div>
        </div>
      `;
    } else {
      htmlContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #475569, #64748b); padding: 25px; text-align: center;">
          ${data.companyLogoUrl ? 
            `<div style="margin-bottom: 15px;">
              <img src="${data.companyLogoUrl}" alt="${data.companyName}" width="200" height="80" style="display: inline-block; max-width: 200px; max-height: 80px; object-fit: contain;" referrerpolicy="no-referrer" crossorigin="anonymous">
            </div>` : 
            `<h2 style="color: white; margin: 0; font-size: 24px;">${data.companyName || 'HireWave'}</h2>`
          }
            <h1 style="color: white; margin: 10px 0 0 0; font-weight: 500; font-size: 24px;">Application Status Update</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 35px 30px; background-color: white;">
            <p style="font-size: 16px; color: #333; margin-top: 0;">Dear ${data.candidateName},</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">${data.message}</p>
            
            ${data.nextSteps ? `
            <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #3b82f6;">
              <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: 600; font-size: 17px;">What's Next?</p>
              <p style="margin: 0; color: #334155; line-height: 1.6;">${data.nextSteps}</p>
            </div>
            ` : ''}
            
            ${data.feedback ? `
            <!-- Feedback Section -->
            <div style="margin: 25px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; color: #334155; font-size: 18px;">Feedback</h3>
              <p style="margin: 10px 0 0 0; color: #334155; line-height: 1.6;">${data.feedback}</p>
            </div>
            ` : ''}

            <!-- Company Details -->
            <table style="width: 100%; margin: 25px 0; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <tr style="background-color: #f8fafc;">
                <td colspan="2" style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                  <h3 style="margin: 0; color: #334155; font-size: 18px;">Company Details</h3>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 120px; font-weight: 500;">Company</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${data.companyName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Position</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">${data.position}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Contact</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">
                  <a href="mailto:${data.contactEmail || EMAIL_CONFIG.EMAIL}" style="color: #2563eb; text-decoration: none;">${data.contactEmail || EMAIL_CONFIG.EMAIL}</a>
                </td>
              </tr>
            </table>
            
            <p style="font-size: 16px; color: #334155; margin-bottom: 0;">
              Best regards,<br>
              <strong>The ${data.companyName} Recruitment Team</strong>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
           <a href="${footerLogoUrl}" target="_blank" style="display: inline-block;">
             <img src="${footerLogoUrl}" alt="HireWave" height="50" style="height: 50px; width: auto; margin-bottom: 15px;" referrerpolicy="no-referrer" crossorigin="anonymous">
           </a>
    <p style="margin: 0; color: #64748b; font-size: 14px;">This is an automated email from HireWave.</p>
    <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">© ${new Date().getFullYear()} HireWave. All rights reserved.</p>
          </div>
        </div>
      `;
    }


    
    // Use the company logo as is, without any replacements
    
    // Set companyLogoUrl explicitly for the email template
    data.companyLogoUrl = data.companyLogo;
    data.hasCompanyLogo = !!data.companyLogo;
    
    // Clear any relative path profile pics
    if (data.companyProfilePic && !data.companyProfilePic.startsWith('http')) {
      data.companyProfilePic = null;
    }
    
    // Log the final company logo data
    console.log('Final company logo data:', {
      companyName: data.companyName,
      hasCompanyLogo: data.hasCompanyLogo,
      companyLogoUrl: data.companyLogoUrl || 'Not provided'
    });
  

    // If companyLogoUrl is not set but we have companyLogo, use it
    if (!data.companyLogoUrl && data.companyLogo && data.companyLogo.trim() !== '' && data.companyLogo.startsWith('http')) {
      data.companyLogoUrl = data.companyLogo;
      console.log('Using companyLogo as companyLogoUrl:', data.companyLogoUrl);
    } else if (data.companyProfilePic && data.companyProfilePic.trim() !== '') {
      if (!data.companyProfilePic.startsWith('http')) {
        console.log('Skipping relative path profile pic');
        data.companyProfilePic = null; // Clear invalid profile pic
      }
    }

    // Remove any default images - only use actual company logos
    if (data.companyLogo && (data.companyLogo.includes('default') || data.companyLogo.includes('placeholder'))) {
      console.log('Removing default/placeholder image');
      data.companyLogo = null;
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

    // Always return success in development
    return res.status(200).json({
      message: EMAIL_CONFIG.ENABLE_ACTUAL_EMAILS
        ? "Email sent successfully"
        : "Email simulation successful (development mode)",
      success: true
    });
  } catch (error) {
    console.error('Email controller error:', error);
    return res.status(500).json({
      message: "Failed to send email",
      success: false,
      error: error.message
    });
  }
};

// Get current user with profile and notifications
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.id; // From auth middleware

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    // Format user data for frontend
    const userData = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      notifications: user.notifications || [],
      notificationPreferences: user.notificationPreferences || {
        emailNotifications: true,
        browserNotifications: true,
        sendCandidateNotifications: true
      }
    };

    return res.status(200).json({
      message: "User retrieved successfully",
      user: userData,
      success: true
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      message: "Failed to retrieve user data",
      success: false,
      error: error.message
    });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.id; // From auth middleware
    const { 
      emailNotifications, 
      browserNotifications, 
      sendCandidateNotifications
    } = req.body;

    // Validate input
    if (emailNotifications === undefined && 
        browserNotifications === undefined && 
        sendCandidateNotifications === undefined) {
      return res.status(400).json({
        message: "At least one notification preference must be provided",
        success: false
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    // Initialize notification preferences if not exist
    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        emailNotifications: true,
        browserNotifications: true,
        sendCandidateNotifications: true
      };
    }

    // Update only provided preferences
    if (emailNotifications !== undefined) {
      user.notificationPreferences.emailNotifications = emailNotifications;
    }
    
    if (browserNotifications !== undefined) {
      user.notificationPreferences.browserNotifications = browserNotifications;
    }
    
    if (sendCandidateNotifications !== undefined && user.role === 'recruiter') {
      user.notificationPreferences.sendCandidateNotifications = sendCandidateNotifications;
    }

    await user.save();

    return res.status(200).json({
      message: "Notification preferences updated successfully",
      notificationPreferences: user.notificationPreferences,
      success: true
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return res.status(500).json({
      message: "Failed to update notification preferences",
      success: false,
      error: error.message
    });
  }
};

// Add notification to a user
export const addNotification = async (req, res) => {
  try {
    const { userId, notification } = req.body;

    if (!userId || !notification || !notification.message) {
      return res.status(400).json({
        message: "Missing required notification data",
        success: false
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    // Initialize notifications array if it doesn't exist
    if (!user.notifications) {
      user.notifications = [];
    }

    // Ensure notification has required fields
    const completeNotification = {
      ...notification,
      isRead: false,
      createdAt: new Date(),
      time: new Date() // Adding time for backward compatibility
    };

    // Add the notification to the user's notifications array
    user.notifications.unshift(completeNotification);

    await user.save();

    console.log("Notification added to user:", userId);

    return res.status(200).json({
      message: "Notification added successfully",
      success: true
    });
  } catch (error) {
    console.error('Notification controller error:', error);
    return res.status(500).json({
      message: "Failed to add notification",
      success: false,
      error: error.message
    });
  }
};

// Mark notifications as read
export const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.id; // From auth middleware

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    if (user.notifications && user.notifications.length > 0) {
      user.notifications.forEach(notification => {
        notification.isRead = true;
      });

      await user.save();
      console.log("Marked all notifications as read for user:", userId);
    }

    return res.status(200).json({
      message: "All notifications marked as read",
      success: true
    });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    return res.status(500).json({
      message: "Failed to mark notifications as read",
      success: false,
      error: error.message
    });
  }
};

// Get candidate by ID
export const getCandidateById = async (req, res) => {
  try {
    const { candidateId } = req.params;

    if (!candidateId) {
      return res.status(400).json({
        message: "Candidate ID is required",
        success: false
      });
    }

    // Find the user with the given ID (regardless of role)
    const candidate = await User.findById(candidateId).select('-password');

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate not found",
        success: false
      });
    }

    // Check if the user has a profile (candidate-specific data)
    if (!candidate.profile) {
      return res.status(404).json({
        message: "Candidate profile not found",
        success: false
      });
    }

    return res.status(200).json({
      message: "Candidate retrieved successfully",
      candidate,
      success: true
    });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return res.status(500).json({
      message: "Failed to retrieve candidate data",
      success: false,
      error: error.message
    });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.id; // From auth middleware

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Both current and new password are required",
        success: false
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    // Verify current password
    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
        success: false
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message: "Password updated successfully",
      success: true
    });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({
      message: "Failed to update password",
      success: false,
      error: error.message
    });
  }
};