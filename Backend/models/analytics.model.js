import mongoose from "mongoose";

const jobViewSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create a compound index to track unique views per user per job
jobViewSchema.index({ job: 1, user: 1 }, { unique: true });

const applyClickSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clickedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create a compound index to track unique apply clicks per user per job
applyClickSchema.index({ job: 1, user: 1 }, { unique: true });

export const JobView = mongoose.model("JobView", jobViewSchema);
export const ApplyClick = mongoose.model("ApplyClick", applyClickSchema);
