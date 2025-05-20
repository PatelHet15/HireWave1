import mongoose from 'mongoose';

const testAttemptSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AptitudeTest',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: {
    type: Object,
    default: {}
  },
  score: {
    type: Number,
    default: 0
  },
  percentageScore: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  completionTime: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create a compound index on testId and candidateId for faster lookups
testAttemptSchema.index({ testId: 1, candidateId: 1 });

export const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);