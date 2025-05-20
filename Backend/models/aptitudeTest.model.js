import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer'],
    default: 'multiple-choice'
  },
  points: {
    type: Number,
    default: 1
  }
});

const aptitudeTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  passingScore: {
    type: Number,
    default: 60 // percentage
  },
  questions: [questionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

aptitudeTestSchema.index({ jobId: 1, roundId: 1 }, { unique: true });

export const AptitudeTest = mongoose.model("AptitudeTest", aptitudeTestSchema);