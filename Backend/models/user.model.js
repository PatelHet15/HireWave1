import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: Number,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'recruiter'],
    required: true,
  },
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    browserNotifications: { type: Boolean, default: true },
    sendCandidateNotifications: { type: Boolean, default: true }
  },
  notifications: [
    {
      message: { type: String, required: true },
      type: { type: String, enum: ['success', 'info', 'warning', 'error'], default: 'info' },
      isRead: { type: Boolean, default: false },
      time: { type: Date, default: Date.now },
      companyLogo: { type: String, default: '' },
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }
    }
  ],
  profile: {
    bio: { type: String },
    skills: [{ type: String }],
    location: { type: String },
    courseField: { type: String }, // ✅ Course Type
    courseName: { type: String }, // ✅ Course Name
    resume: { type: String }, // Resume URL
    resumeOriginalName: { type: String },
    resumeUpdatedAt: { type: Date },
    resumeAnalysis: {
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      atsScore: { type: Number },
      suggestions: [{ type: String }],
      resumeHash: { type: String },
      analyzedAt: { type: Date, default: Date.now }
    },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    profilePhoto: {
      type: String,
      default: ""
    },
    dob: { type: Date }, // ✅ Date of Birth Added
    gender: { type: String, enum: ["Male", "Female", "Other", ""] }, // ✅ Gender Added

    // New fields
    preferredLocation: {
      type: String,
      default: ""
    },
    jobType: {
      type: String,
      enum: ["Full Time", "Part Time", "Internship", "Contract",""],
      default: ""
    },
    preferredRole: {
      type: String,
      default: ""
    },
    
    // Education
    collegeName: {
      type: String,
      default: ""
    },
    collegeYear: {
      type: String,
      default: ""
    },
    twelfthSchool: {
      type: String,
      default: ""
    },
    twelfthYear: {
      type: String,
      default: ""
    },
    twelfthPercentage: {
      type: String,
      default: ""
    },
    tenthSchool: {
      type: String,
      default: ""
    },
    tenthYear: {
      type: String,
      default: ""
    },
    tenthPercentage: {
      type: String,
      default: ""
    },
    
    // Internships
    internships: [{
      role: {
        type: String,
        required: true
      },
      company: {
        type: String,
        required: true
      },
      duration: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      }
    }],
    
    // Projects
    projects: [{
      name: {
        type: String,
        required: true
      },
      technologies: {
        type: String,
        required: true
      },
      duration: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      link: {
        type: String,
        default: ""
      }
    }],
    
    // Employment History
    employmentHistory: [{
      role: {
        type: String,
        required: true
      },
      company: {
        type: String,
        required: true
      },
      duration: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      }
    }]
  }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
export default User;