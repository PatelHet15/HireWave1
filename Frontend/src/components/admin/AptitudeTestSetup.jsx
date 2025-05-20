import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '../shared/Navbar';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ArrowLeft, Plus, Trash2, Save, Link, FileQuestion, CheckCircle2, GripVertical, ChevronDown, ChevronUp, Copy, Pencil } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { JOB_API_END_POINT, PIPELINE_API_END_POINT } from '@/utils/constant';
import { getQuestionsByRole } from '@/utils/aptitudeQuestionTemplates';

const QuestionTypeOptions = [
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'true-false', label: 'True/False' },
  { value: 'short-answer', label: 'Short Answer' }
];

const AptitudeTestSetup = () => {
  const { jobId, roundId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState(null);
  const [round, setRound] = useState(null);
  const [existingTest, setExistingTest] = useState(null);
  
  // Form data for the test
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    duration: 60,
    passingScore: 60,
    questions: []
  });
  
  // For editing a specific question
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    type: 'multiple-choice',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    points: 1
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);

  const [isReordering, setIsReordering] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [categories, setCategories] = useState(['General']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [reorderingSaving, setReorderingSaving] = useState(false);

  // Debug useEffect to track testData changes
  useEffect(() => {
    console.log('testData updated:', testData);
    if (testData.questions) {
      console.log('Questions count:', testData.questions.length);
    }
  }, [testData]);

  useEffect(() => {
    fetchJobAndRoundDetails();
  }, [jobId, roundId]);

  // Duplicate a question
  const duplicateQuestion = (index) => {
    const questionToDuplicate = { ...testData.questions[index] };
    const newQuestion = {
      ...questionToDuplicate,
      questionText: `${questionToDuplicate.questionText} (Copy)`
    };
    
    setTestData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    
    toast.success('Question duplicated');
  };

  // Toggle question expansion
  const toggleQuestionExpand = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  // Get filtered questions based on selected category
  const getFilteredQuestions = () => {
    if (selectedCategory === 'All') {
      return testData.questions;
    }
    
    // In a real implementation, you would have a category field in each question
    // For now, we'll just return all questions since we haven't implemented categories yet
    return testData.questions;
  };
  
  // New function to initialize role-based questions
  const initializeRoleBasedQuestions = () => {
    // Check if we already have questions and confirm before overwriting
    if (testData.questions.length > 0) {
      if (!window.confirm("This will replace your existing questions with template questions. Continue?")) {
        return;
      }
    }
    
    // Check if we have the job data
    if (job && round && round.type === 'aptitude') {
      // Get job position/role
      const jobRole = job.title || 'default';
      console.log(`Searching for role-based questions for: ${jobRole}`);
      const roleQuestions = getQuestionsByRole(jobRole);
      
      console.log('Found template questions:', roleQuestions);
      
      if (roleQuestions && roleQuestions.length > 0) {
        // Format questions for our component's state structure
        const formattedQuestions = roleQuestions.map(q => {
          console.log('Processing question:', q);
          
          // For multiple choice or true/false questions
          if (q.type === 'multiple-choice' || q.type === 'true-false') {
            const options = q.options.map((option, idx) => ({
              text: option,
              isCorrect: idx === q.correctOption
            }));
            
            return {
              questionText: q.questionText,
              type: q.type,
              options: options,
              points: q.points || 1
            };
          } 
          // For short answer questions
          else if (q.type === 'short-answer') {
            return {
              questionText: q.questionText,
              type: q.type,
              options: [],
              points: q.points || 1
            };
          }
          return null;
        }).filter(q => q !== null);
        
        console.log('Formatted questions:', formattedQuestions);
        
        // Update test data with the new questions and a title
        setTestData(prev => {
          const updatedData = {
            ...prev,
            title: prev.title || `${job.title} Aptitude Assessment`,
            description: prev.description || `Assessment for ${job.title} position. Please answer all questions to the best of your ability.`,
            questions: formattedQuestions
          };
          console.log('Updated test data:', updatedData);
          return updatedData;
        });
        
        toast.success(`Loaded ${formattedQuestions.length} questions based on the ${jobRole} role`);
      } else {
        console.warn(`No template questions found for ${jobRole} role`);
        toast.error(`No template questions found for ${jobRole} role`);
      }
    } else {
      console.error("Could not load job details:", { job, round });
      toast.error("Could not load job details to determine appropriate questions");
    }
  };

  const fetchJobAndRoundDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch job details
      const jobRes = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        }
      });
      
      if (jobRes.data.success) {
        setJob(jobRes.data.job);
        
        // Find the specific round
        const foundRound = jobRes.data.job.interviewRounds?.find(r => r._id === roundId);
        if (foundRound) {
          setRound(foundRound);
          // Check if this round already has an aptitude test
          // SUPPORT BOTH round.aptitudeTestLink and round.aptitudeTest (ObjectId)
          let testId = null;
          if (foundRound.aptitudeTestLink && foundRound.aptitudeTestLink.startsWith('internal:')) {
            testId = foundRound.aptitudeTestLink.replace('internal:', '');
          } else if (foundRound.aptitudeTest) {
            testId = foundRound.aptitudeTest;
          }
          if (testId) {
            await fetchAptitudeTest(testId);
          }
        } else {
          toast.error('Interview round not found');
          navigate(`/admin/jobs/pipeline/${jobId}`);
        }
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job or round details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAptitudeTest = async (testId) => {
    try {
      // Try both possible endpoints for fetching the test
      let testRes = null;
      try {
        // Try the documented endpoint first
        testRes = await axios.get(`${PIPELINE_API_END_POINT}/aptitude-test/${testId}`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') && {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            })
          }
        });
      } catch (err) {
        // Fallback to /test/:testId if the above fails
        try {
          testRes = await axios.get(`${PIPELINE_API_END_POINT}/test/${testId}`, {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('token') && {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              })
            }
          });
        } catch (e) {
          // If both fail, surface the error
          throw err;
        }
      }
      if (testRes && testRes.data.success) {
        const test = testRes.data.aptitudeTest;
        setExistingTest(test);
        setTestData({
          title: test.title,
          description: test.description,
          duration: test.duration,
          passingScore: test.passingScore,
          questions: test.questions
        });
      }
    } catch (error) {
      console.error('Error fetching aptitude test:', error);
      // If we can't fetch the test, we'll just create a new one
    }
  };

  const handleTestDataChange = (e) => {
    const { name, value } = e.target;
    setTestData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'passingScore' ? Number(value) : value
    }));
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: name === 'points' ? Number(value) : value
    }));
  };

  const handleQuestionTypeChange = (value) => {
    setCurrentQuestion(prev => {
      // For true/false, we need only 2 options
      let options = prev.options;
      if (value === 'true-false') {
        options = [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ];
      } else if (value === 'short-answer') {
        options = [];
      } else if (prev.type === 'true-false' || prev.type === 'short-answer') {
        // If changing from true/false or short-answer to multiple choice
        options = [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ];
      }
      
      return {
        ...prev,
        type: value,
        options
      };
    });
  };

  const handleOptionChange = (index, e) => {
    const { value } = e.target;
    setCurrentQuestion(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], text: value };
      return { ...prev, options: newOptions };
    });
  };

  const handleCorrectOptionChange = (index) => {
    setCurrentQuestion(prev => {
      const newOptions = prev.options.map((option, i) => ({
        ...option,
        isCorrect: i === index
      }));
      return { ...prev, options: newOptions };
    });
  };

  const addOption = () => {
    if (currentQuestion.options.length < 6) {
      setCurrentQuestion(prev => ({
        ...prev,
        options: [...prev.options, { text: '', isCorrect: false }]
      }));
    } else {
      toast.error('Maximum 6 options allowed');
    }
  };

  const removeOption = (index) => {
    if (currentQuestion.options.length > 2) {
      setCurrentQuestion(prev => {
        const newOptions = prev.options.filter((_, i) => i !== index);
        
        // If we're removing the correct option, set the first one as correct
        const hasCorrectOption = newOptions.some(opt => opt.isCorrect);
        if (!hasCorrectOption) {
          newOptions[0].isCorrect = true;
        }
        
        return { ...prev, options: newOptions };
      });
    } else {
      toast.error('Minimum 2 options required');
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.questionText.trim()) {
      toast.error('Question text is required');
      return;
    }
    
    if (currentQuestion.type !== 'short-answer' && 
        !currentQuestion.options.some(opt => opt.isCorrect)) {
      toast.error('Please mark at least one option as correct');
      return;
    }
    
    if (currentQuestion.type !== 'short-answer' && 
        currentQuestion.options.some(opt => !opt.text.trim())) {
      toast.error('All options must have text');
      return;
    }
    
    // Log the current question being added
    console.log('Adding question:', currentQuestion);
    
    // Create a deep copy of the current question to avoid reference issues
    const questionCopy = JSON.parse(JSON.stringify(currentQuestion));
    console.log('Deep copy of question:', questionCopy);
    
    if (editingQuestionIndex >= 0) {
      // Update existing question
      setTestData(prev => {
        const newQuestions = [...prev.questions];
        newQuestions[editingQuestionIndex] = questionCopy;
        console.log('Updated questions array:', newQuestions);
        return { ...prev, questions: newQuestions };
      });
    } else {
      // Add new question
      setTestData(prev => {
        const newQuestions = [...prev.questions, questionCopy];
        console.log('New questions array:', newQuestions);
        return { ...prev, questions: newQuestions };
      });
    }
    
    // Add confirmation message
    toast.success(editingQuestionIndex >= 0 ? 'Question updated successfully' : 'Question added successfully');
    
    // Reset current question
    setCurrentQuestion({
      questionText: '',
      type: 'multiple-choice',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      points: 1
    });
    setEditingQuestionIndex(-1);
  };

  const editQuestion = (index) => {
    setCurrentQuestion(testData.questions[index]);
    setEditingQuestionIndex(index);
  };

  const deleteQuestion = (index) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const saveInternalTest = async () => {
    if (!testData.title.trim() || testData.questions.length === 0) {
      toast.error('Please fill in all required fields and add at least one question.');
      return;
    }
    
    // Debug log before saving
    console.log('Saving test data with questions:', testData.questions);
    
    try {
      setSaving(true);
      const testId = existingTest?._id;
      
      // Ensure questions have the correct structure for the API
      const formattedQuestions = testData.questions.map(q => {
        // Ensure each question has the required fields
        return {
          questionText: q.questionText,
          type: q.type,
          options: q.options.map(opt => ({
            text: opt.text,
            isCorrect: opt.isCorrect
          })),
          points: q.points || 1
        };
      });
      
      // Prepare the payload for either update or create
      const payload = {
        title: testData.title,
        description: testData.description,
        duration: Number(testData.duration),
        passingScore: Number(testData.passingScore),
        questions: formattedQuestions
      };
      
      // Debug log the payload
      console.log('Payload for API request:', payload);
      
      // Headers for all requests
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };
      
      let res;
      
      if (testId) {
        // Case 1: Test exists - update it using the PUT endpoint
        console.log(`Updating existing test with ID: ${testId}`);
        res = await axios.put(
          `${PIPELINE_API_END_POINT}/job/${jobId}/round/${roundId}/aptitude-test`,
          payload,
          {
            withCredentials: true,
            headers
          }
        );
      } else if (round && round._id && !round._id.startsWith('temp-')) {
        // Case 2: No test exists but round is valid - create new test
        console.log(`Creating new test for round ID: ${round._id}`);
        res = await axios.post(
          `${PIPELINE_API_END_POINT}/job/${jobId}/round/${round._id}/aptitude-test`,
          payload,
          {
            withCredentials: true,
            headers
          }
        );
      } else {
        throw new Error('Invalid round or test information');
      }
      
      if (res.data.success) {
        // Update local test data with what came back from server
        if (res.data.aptitudeTest) {
          setExistingTest(res.data.aptitudeTest);
          
          // Update test data state with the returned data to ensure consistency
          setTestData({
            title: res.data.aptitudeTest.title,
            description: res.data.aptitudeTest.description,
            duration: res.data.aptitudeTest.duration,
            passingScore: res.data.aptitudeTest.passingScore,
            questions: res.data.aptitudeTest.questions
          });
        }
        
        toast.success(testId ? 'Aptitude test updated successfully' : 'Aptitude test created successfully');
        navigate(`/admin/jobs/pipeline/${jobId}`);
      } else {
        toast.error(res.data.message || 'Failed to save aptitude test');
      }
    } catch (error) {
      console.error('Error saving aptitude test:', error);
      toast.error(error.response?.data?.message || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };
  
  // Save reordered questions
  const saveReorderedQuestions = async () => {
    if (!existingTest) {
      setIsReordering(false);
      return; // No test to save yet
    }
    
    try {
      setReorderingSaving(true);
      
      const res = await axios.put(`${PIPELINE_API_END_POINT}/test/${existingTest._id}/questions`, 
        { questions: testData.questions },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') && {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            })
          }
        }
      );
      
      if (res.data.success) {
        toast.success('Question order saved successfully');
        setIsReordering(false);
      }
    } catch (error) {
      console.error('Error saving question order:', error);
      toast.error('Failed to save question order');
    } finally {
      setReorderingSaving(false);
    }
  };

  // Helper function to check state health
  const debugTestData = () => {
    console.log('Current test data state:', testData);
    console.log('Questions count:', testData.questions.length);
    console.log('Question objects:', testData.questions);
    
    // Test adding a question programmatically
    const testQuestion = {
      questionText: 'Debug test question',
      type: 'multiple-choice',
      options: [
        { text: 'Option 1', isCorrect: true },
        { text: 'Option 2', isCorrect: false }
      ],
      points: 1
    };
    
    setTestData(prev => {
      const newQuestions = [...prev.questions, testQuestion];
      console.log('New questions array after test:', newQuestions);
      return { ...prev, questions: newQuestions };
    });
    
    toast.success('Added debug test question');
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto pt-10 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto pt-8 pb-16 px-4">
        <div className="flex items-center mb-8">
          <button 
            onClick={() => navigate(`/admin/jobs/pipeline/${jobId}`)}
            className="text-gray-600 hover:text-gray-900 mr-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Aptitude Test Setup</h1>
            <p className="text-gray-500 mt-1">
              {job?.title} - {round?.name}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Test Information</h2>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Test Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  name="title"
                  value={testData.title}
                  onChange={handleTestDataChange}
                  placeholder="e.g. Frontend Developer Aptitude Test"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={testData.description}
                  onChange={handleTestDataChange}
                  placeholder="Instructions or description for candidates..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="5"
                    max="180"
                    value={testData.duration}
                    onChange={handleTestDataChange}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="passingScore">Passing Score (%)</Label>
                  <Input
                    id="passingScore"
                    name="passingScore"
                    type="number"
                    min="1"
                    max="100"
                    value={testData.passingScore}
                    onChange={handleTestDataChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Template Questions */}
          {job && !existingTest && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileQuestion className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-blue-800">Job-Specific Questions Available</h3>
                    <p className="text-blue-600 text-sm">
                      We've detected this is a {job.title} role. Would you like to use our template questions?
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-100"
                  onClick={initializeRoleBasedQuestions}
                >
                  Load Template Questions
                </Button>
              </div>
            </div>
          )}
          
          {/* Questions Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-5 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Questions</h2>
                  {testData.questions.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">{testData.questions.length}</span> questions configured
                      {job?.title && testData.questions.length > 0 && (
                        <span className="italic ml-1">
                          (based on {job.title} role)
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  {testData.questions.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (isReordering) {
                          saveReorderedQuestions();
                        } else {
                          setIsReordering(true);
                        }
                      }}
                      className="text-blue-600 border-gray-200 hover:bg-blue-50"
                      disabled={reorderingSaving}
                    >
                      {reorderingSaving ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                          Saving...
                        </>
                      ) : isReordering ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Done
                        </>
                      ) : (
                        <>
                          <GripVertical className="h-4 w-4 mr-1" />
                          Reorder
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={() => setCurrentQuestion({
                      questionText: '',
                      type: 'multiple-choice',
                      options: [
                        { text: '', isCorrect: true },
                        { text: '', isCorrect: false },
                        { text: '', isCorrect: false },
                        { text: '', isCorrect: false }
                      ],
                      points: 1
                    })}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Question
                  </Button>
                  
                  {/* Add button to load template questions */}
                  <Button
                    onClick={initializeRoleBasedQuestions}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <FileQuestion className="w-4 h-4 mr-1" />
                    Load Template Questions
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Category filter */}
            {testData.questions.length > 0 && (
              <div className="mt-4 flex items-center">
                <Label htmlFor="categoryFilter" className="mr-2 text-sm">Filter:</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger id="categoryFilter" className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500 ml-3">
                  {selectedCategory === 'All' 
                    ? `Showing all ${testData.questions.length} questions` 
                    : `Showing ${getFilteredQuestions().length} questions`}
                </span>
              </div>
            )}
          </div>
          
          {/* Questions List */}
          <div className="p-3">
            {testData.questions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg mx-2">
                <p className="text-gray-500">No questions added yet. Add your first question or use a template.</p>
              </div>
            ) : isReordering ? (
              <Reorder.Group 
                axis="y" 
                values={testData.questions} 
                onReorder={(newOrder) => setTestData(prev => ({...prev, questions: newOrder}))}
                className="space-y-2"
              >
                {testData.questions.map((question, index) => (
                  <Reorder.Item 
                    key={`question-${index}`} 
                    value={question}
                    className="cursor-move"
                  >
                    <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 truncate">
                        <p className="font-medium text-gray-900 truncate">{question.questionText}</p>
                        <p className="text-sm text-gray-500">
                          {QuestionTypeOptions.find(t => t.value === question.type)?.label || question.type} 
                          {question.points > 1 ? ` • ${question.points} points` : ''}
                        </p>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        Q{index + 1}
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              <div className="space-y-2">
                {getFilteredQuestions().map((question, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">{question.questionText}</h5>
                        <p className="text-sm text-gray-500 mt-1">
                          {QuestionTypeOptions.find(t => t.value === question.type)?.label} 
                          {question.points > 1 ? ` (${question.points} points)` : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:text-blue-600"
                          onClick={() => editQuestion(index)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:text-red-600"
                          onClick={() => deleteQuestion(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {question.type !== 'short-answer' && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center">
                            <span className={`inline-block w-4 h-4 rounded-full mr-2 ${option.isCorrect ? 'bg-green-500' : 'bg-gray-200'}`}></span>
                            <span className={option.isCorrect ? 'font-medium' : ''}>{option.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <Button
              onClick={debugTestData}
              variant="outline"
              className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 mr-2"
            >
              Debug Test
            </Button>
            <Button
              onClick={saveInternalTest}
              disabled={!testData.title.trim() || testData.questions.length === 0 || saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Aptitude Test
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AptitudeTestSetup; 