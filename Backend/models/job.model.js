import mongoose from "mongoose";

const interviewRoundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Round name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  type: {
    type: String,
    enum: {
      values: ['aptitude', 'technical', 'hr', 'assignment', 'other'],
      message: '{VALUE} is not a valid interview round type'
    },
    required: [true, 'Interview round type is required'],
    default: 'other'
  },
  order: {
    type: Number,
    required: [true, 'Round order is required'],
    min: [0, 'Order must be 0 or greater']
  },
  aptitudeTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AptitudeTest'
  },
  passingScore: {
    type: Number,
    default: 60,
    min: [0, 'Passing score cannot be less than 0'],
    max: [100, 'Passing score cannot be more than 100'],
    validate: {
      validator: function (v) {
        return this.type !== 'aptitude' || (typeof v === 'number' && v >= 0 && v <= 100);
      },
      message: 'Passing score must be between 0 and 100 for aptitude rounds'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const roundStatusSchema = new mongoose.Schema({
  round: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'passed', 'failed', 'awaiting_review'],
    default: 'pending',
    required: true
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    validate: {
      validator: function(v) {
        // Only require score for aptitude rounds
        return this.parent().type !== 'aptitude' || (v >= 0 && v <= 100);
      },
      message: 'Score must be between 0-100 for aptitude rounds'
    }
  },
  feedback: {
    type: String,
    default: "",
    trim: true
  },
  completedAt: {
    type: Date,
    validate: {
      validator: function(v) {
        // CompletedAt is required for passed/failed rounds
        return !['passed', 'failed'].includes(this.status) || v;
      },
      message: 'Completion date is required for passed/failed rounds'
    }
  }
}, { _id: false });

const candidateProgressSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentRound: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  roundsStatus: {
    type: [roundStatusSchema],
    default: []
  },
  overallStatus: {
    type: String,
    enum: ['applied', 'in_process', 'hired', 'rejected', 'awaiting_final_decision'],
    default: 'applied',
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    required: true
  }
}, { _id: false });

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true
  },
  requirements: {
    type: [String],
    required: [true, 'Job requirements are required'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one requirement is required'
    }
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: 0
  },
  jobLocation: {
    type: String,
    required: [true, 'Job location is required'],
    trim: true
  },
  experienceLevel: {
    type: String,
    required: [true, 'Experience level is required'],
    enum: ['entry', 'Mid Level', 'Senior', 'lead', 'executive'], // Ensure these match exactly
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: ['Full Time', 'Part Time', 'contract', 'internship', 'remote'], // Exact values
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: [true, 'Company reference is required']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, 'Creator reference is required']
  },
  applyBy: {
    type: Date,
    required: [true, 'Application deadline is required'],
    validate: {
      validator: function(v) {
        return v > Date.now();
      },
      message: 'Apply-by date must be in the future'
    }
  },
  openings: {
    type: Number,
    required: [true, 'Number of openings is required'],
    min: 1
  },
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application"
  }],
  perks: {
    type: [String],
    default: []
  },
  interviewRounds: {
    type: [interviewRoundSchema],
    default: [],
    validate: {
      validator: function (rounds) {
        if (!Array.isArray(rounds)) return false;

        const orders = rounds.map(r => r.order);
        const uniqueOrders = new Set(orders);

        if (uniqueOrders.size !== orders.length) return false;

        const sorted = [...uniqueOrders].sort((a, b) => a - b);
        return sorted.every((val, index) => val === index);
      },
      message: 'Interview rounds must have unique and sequential "order" values starting from 0 (e.g., 0, 1, 2, ...)'
    }
  },  
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }],
  candidateProgress: {
    type: [candidateProgressSchema],
    default: []
  }
}, { timestamps: true });

// Indexes for better query performance
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ company: 1 });
jobSchema.index({ created_by: 1 });
jobSchema.index({ applyBy: 1 });
jobSchema.index({ 'interviewRounds.type': 1 });

// Pre-save validation for interview rounds
jobSchema.pre('validate', function(next) {
  if (this.interviewRounds && this.interviewRounds.length > 0) {
    this.interviewRounds = this.interviewRounds
      .sort((a, b) => a.order - b.order)
      .map((round, index) => {
        round.order = index;
        return round;
      });
  }

  if (this.candidateProgress?.length > 0 && this.interviewRounds.length === 0) {
    return next(new Error('Jobs with candidates must have interview rounds'));
  }

  next();
});

export const Job = mongoose.model("Job", jobSchema);