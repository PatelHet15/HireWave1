import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  currentRound: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job.interviewRounds',
    default: null // Will be set to first aptitude round on acceptance
  },
  roundsStatus: [{
    round: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job.interviewRounds',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in_process', 'passed', 'failed', 'awaiting_review'],
      default: 'pending',
      required: true
    },
    feedback: {
      type: String,
      default: ''
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notificationSent: {
    type: Boolean,
    default: false
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  currentStage: {
    type: String,
    default: 'Not Started'
  },
  overallStatus: {
    type: String,
    enum: ['applied', 'in_progress', 'hired', 'rejected'],
    default: 'applied'
  }
}, { timestamps: true });

// Add a unique compound index to prevent duplicate applications
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);
