// Role-based aptitude question templates for different job categories
const AptitudeQuestionTemplates = {
  // Software Development Questions
  "software developer": [
    {
      questionText: "What is the time complexity of a binary search algorithm?",
      type: "multiple-choice",
      options: ["O(n)", "O(n log n)", "O(log n)", "O(n²)"],
      correctOption: 2, // O(log n)
      points: 2
    },
    {
      questionText: "Which data structure operates on a LIFO (Last In First Out) principle?",
      type: "multiple-choice",
      options: ["Queue", "Stack", "Linked List", "Tree"],
      correctOption: 1, // Stack
      points: 1
    },
    {
      questionText: "What does HTML stand for?",
      type: "multiple-choice",
      options: ["Hyper Text Markup Language", "High-level Text Management Language", "Hyper Transfer Markup Language", "Hierarchical Text Markup Language"],
      correctOption: 0,
      points: 1
    },
    {
      questionText: "Which of the following is not a JavaScript framework or library?",
      type: "multiple-choice",
      options: ["React", "Angular", "Swift", "Vue"],
      correctOption: 2, // Swift
      points: 1
    },
    {
      questionText: "The statement `x == y` in JavaScript checks for value equality without checking the type.",
      type: "true-false",
      correctOption: 0, // True
      options: ["True", "False"],
      points: 1
    }
  ],

  // Data Science Questions
  "data scientist": [
    {
      questionText: "Which of the following is not a supervised learning algorithm?",
      type: "multiple-choice",
      options: ["Linear Regression", "K-means Clustering", "Support Vector Machines", "Random Forest"],
      correctOption: 1, // K-means Clustering
      points: 2
    },
    {
      questionText: "What does NLP stand for in the context of AI?",
      type: "multiple-choice",
      options: ["Neural Logic Programming", "Natural Language Processing", "New Learning Paradigm", "Network Linked Protocol"],
      correctOption: 1, // Natural Language Processing
      points: 1
    },
    {
      questionText: "Which Python library is commonly used for data manipulation and analysis?",
      type: "multiple-choice",
      options: ["Matplotlib", "TensorFlow", "Pandas", "Flask"],
      correctOption: 2, // Pandas
      points: 1
    },
    {
      questionText: "Overfitting occurs when a model learns the training data too well, including its noise and outliers.",
      type: "true-false",
      options: ["True", "False"],
      correctOption: 0, // True
      points: 1
    },
    {
      questionText: "Explain what a confusion matrix is and how it helps in evaluating a classification model.",
      type: "short-answer",
      points: 3
    }
  ],

  // Marketing Questions
  "marketing": [
    {
      questionText: "What does CPA stand for in digital marketing?",
      type: "multiple-choice",
      options: ["Cost Per Action", "Customer Profile Analysis", "Content Planning Assessment", "Customer Preference Analysis"],
      correctOption: 0, // Cost Per Action
      points: 1
    },
    {
      questionText: "Which of the following is NOT typically considered a social media platform for marketing?",
      type: "multiple-choice",
      options: ["LinkedIn", "Instagram", "Slack", "Twitter"],
      correctOption: 2, // Slack
      points: 1
    },
    {
      questionText: "Which marketing approach focuses on creating and distributing valuable content to attract a target audience?",
      type: "multiple-choice",
      options: ["Outbound Marketing", "Content Marketing", "Direct Marketing", "Guerrilla Marketing"],
      correctOption: 1, // Content Marketing
      points: 1
    },
    {
      questionText: "A/B testing is a method of comparing two versions of a webpage or app to determine which performs better.",
      type: "true-false",
      options: ["True", "False"],
      correctOption: 0, // True
      points: 1
    },
    {
      questionText: "Describe a marketing campaign you admire and explain what made it effective.",
      type: "short-answer",
      points: 3
    }
  ],

  // Finance Questions
  "finance": [
    {
      questionText: "What is the formula for calculating ROI (Return on Investment)?",
      type: "multiple-choice",
      options: ["(Net Profit / Cost of Investment) × 100", "(Revenue - Cost) / Revenue × 100", "Revenue / Cost × 100", "Assets - Liabilities"],
      correctOption: 0, // (Net Profit / Cost of Investment) × 100
      points: 1
    },
    {
      questionText: "Which of the following is not one of the three main financial statements?",
      type: "multiple-choice",
      options: ["Income Statement", "Balance Sheet", "Cash Flow Statement", "Equity Distribution Statement"],
      correctOption: 3, // Equity Distribution Statement
      points: 1
    },
    {
      questionText: "What does P/E ratio stand for?",
      type: "multiple-choice",
      options: ["Profit/Expense", "Price/Earnings", "Potential/Estimation", "Performance/Efficiency"],
      correctOption: 1, // Price/Earnings
      points: 1
    },
    {
      questionText: "EBITDA stands for Earnings Before Interest, Taxes, Depreciation, and Amortization.",
      type: "true-false",
      options: ["True", "False"],
      correctOption: 0, // True
      points: 1
    },
    {
      questionText: "Explain the difference between CAPEX and OPEX with an example of each.",
      type: "short-answer",
      points: 3
    }
  ],

  // HR Questions
  "hr": [
    {
      questionText: "What does the term 'employee engagement' refer to?",
      type: "multiple-choice",
      options: ["The legal contract between employer and employee", "The emotional commitment an employee has to the organization", "The process of hiring new staff", "The employee's working hours"],
      correctOption: 1, // The emotional commitment an employee has to the organization
      points: 1
    },
    {
      questionText: "Which of these is NOT typically a function of an HR department?",
      type: "multiple-choice",
      options: ["Recruitment", "Training", "Financial Auditing", "Performance Management"],
      correctOption: 2, // Financial Auditing
      points: 1
    },
    {
      questionText: "What is the purpose of a job analysis?",
      type: "multiple-choice",
      options: ["To determine employee satisfaction", "To determine the essential duties and requirements of a job", "To compare salaries across the industry", "To assess an employee's performance"],
      correctOption: 1, // To determine the essential duties and requirements of a job
      points: 1
    },
    {
      questionText: "Onboarding and orientation are exactly the same thing.",
      type: "true-false",
      options: ["True", "False"],
      correctOption: 1, // False
      points: 1
    },
    {
      questionText: "Describe your approach to resolving a conflict between two team members.",
      type: "short-answer",
      points: 3
    }
  ],

  // General Questions (default)
  "default": [
    {
      questionText: "If it takes 8 hours to print 40 documents, how many documents can be printed in 2 hours?",
      type: "multiple-choice",
      options: ["5", "8", "10", "16"],
      correctOption: 2, // 10
      points: 1
    },
    {
      questionText: "Which of these words is a synonym for 'diligent'?",
      type: "multiple-choice",
      options: ["Careless", "Hard-working", "Intelligent", "Creative"],
      correctOption: 1, // Hard-working
      points: 1
    },
    {
      questionText: "Complete the sequence: 2, 4, 8, 16, __",
      type: "multiple-choice",
      options: ["24", "32", "20", "64"],
      correctOption: 1, // 32
      points: 1
    },
    {
      questionText: "Effective communication skills are important in any workplace.",
      type: "true-false",
      options: ["True", "False"],
      correctOption: 0, // True
      points: 1
    },
    {
      questionText: "Describe a challenging situation you faced at work or school and how you handled it.",
      type: "short-answer",
      points: 3
    }
  ]
};

// Get questions based on job position/role
export const getQuestionsByRole = (position) => {
  if (!position) {
    console.log('No position provided, returning default questions');
    return AptitudeQuestionTemplates.default;
  }
  
  // Normalize the position string (lowercase, trim)
  const normalizedPosition = position.toLowerCase().trim();
  console.log('Normalized position:', normalizedPosition);
  
  // Debug log all available roles
  console.log('Available roles:', Object.keys(AptitudeQuestionTemplates));
  
  // Check for specific role matches
  for (const [role, questions] of Object.entries(AptitudeQuestionTemplates)) {
    console.log(`Checking if position "${normalizedPosition}" includes "${role}"`);
    if (normalizedPosition.includes(role)) {
      console.log(`Match found for role "${role}" with ${questions.length} questions`);
      return questions;
    }
  }
  
  // Check for category matches with more debugging
  console.log('No direct role match, checking category matches');
  
  if (normalizedPosition.includes('develop') || normalizedPosition.includes('engineer') || 
      normalizedPosition.includes('program') || normalizedPosition.includes('code')) {
    console.log('Match found for software developer category');
    return AptitudeQuestionTemplates["software developer"];
  }
  
  if (normalizedPosition.includes('data') || normalizedPosition.includes('analyst') || 
      normalizedPosition.includes('machine learning') || normalizedPosition.includes('ai')) {
    console.log('Match found for data scientist category');
    return AptitudeQuestionTemplates["data scientist"];
  }
  
  if (normalizedPosition.includes('market') || normalizedPosition.includes('brand') || 
      normalizedPosition.includes('content') || normalizedPosition.includes('social media')) {
    console.log('Match found for marketing category');
    return AptitudeQuestionTemplates.marketing;
  }
  
  if (normalizedPosition.includes('financ') || normalizedPosition.includes('account') || 
      normalizedPosition.includes('budget') || normalizedPosition.includes('audit')) {
    console.log('Match found for finance category');
    return AptitudeQuestionTemplates.finance;
  }
  
  if (normalizedPosition.includes('hr') || normalizedPosition.includes('human resource') || 
      normalizedPosition.includes('recruit') || normalizedPosition.includes('talent')) {
    console.log('Match found for HR category');
    return AptitudeQuestionTemplates.hr;
  }
  
  // Default to general questions if no match found
  console.log('No category match found, using default questions');
  return AptitudeQuestionTemplates.default;
};

// General aptitude questions that can be used for any role
export const generalAptitudeQuestions = [
  {
    questionText: "What comes next in the sequence: 2, 4, 8, 16, __?",
    type: "multiple-choice",
    options: ["24", "32", "28", "20"],
    correctOption: 1,  // 32
    points: 5
  },
  {
    questionText: "If a shirt costs $20 after a 20% discount, what was its original price?",
    type: "multiple-choice",
    options: ["$22", "$24", "$25", "$28"],
    correctOption: 2,  // $25
    points: 5
  },
  {
    questionText: "Which word does NOT belong with the others? Apple, Banana, Carrot, Orange",
    type: "multiple-choice",
    options: ["Apple", "Banana", "Carrot", "Orange"],
    correctOption: 2,  // Carrot
    points: 5
  }
];

export default AptitudeQuestionTemplates;