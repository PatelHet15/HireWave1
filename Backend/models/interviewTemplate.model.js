import mongoose from "mongoose";

const aptitudeQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
    required: true,
  }],
  correctOption: {
    type: Number,
    required: true,
  }
});

const roundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['aptitude', 'technical', 'hr'],
    required: true,
  },
  aptitudeQuestions: [aptitudeQuestionSchema],
  passingCriteria: {
    type: Number,
    default: 70, // Default passing percentage for aptitude test
  }
});

const interviewTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  rounds: [roundSchema],
  isDefault: {
    type: Boolean,
    default: false,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

export const InterviewTemplate = mongoose.model("InterviewTemplate", interviewTemplateSchema);
