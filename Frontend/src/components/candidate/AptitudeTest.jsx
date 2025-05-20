import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '../shared/Navbar';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { ArrowLeft, ArrowRight, Check, Timer, AlertTriangle, FileText, BookOpen, Award, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { PIPELINE_API_END_POINT } from '@/utils/constant';
import { motion, AnimatePresence } from 'framer-motion';

const AptitudeTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testData, setTestData] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [roundData, setRoundData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Validate params exist
  useEffect(() => {
    if (!testId) {
      toast.error('Invalid test link');
      navigate('/candidate/dashboard');
    }
  }, [testId, navigate]);

  useEffect(() => {
    if (testId) {
      fetchTestData();
    }
  }, [testId]);

  useEffect(() => {
    if (!testStarted || !timeLeft) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, timeLeft]);

  const fetchTestData = async () => {
    try {
      setLoading(true);
      console.log('[Aptitude Test] Fetching test data for ID:', testId);

      // Extract jobId and roundId from URL query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const jobIdParam = urlParams.get('jobId');
      const roundIdParam = urlParams.get('roundId');

      // Use the correct endpoint as defined in the backend router
      const endpoint = `${PIPELINE_API_END_POINT}/aptitude-test/${testId}`;
      console.log(`[Aptitude Test] Using endpoint: ${endpoint}`);
      
      const res = await axios.get(endpoint, {
        params: {
          jobId: jobIdParam,
          roundId: roundIdParam
        },
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to fetch test data');
      }
      
      console.log('[Aptitude Test] Successfully fetched test data:', res.data);
      
      const { aptitudeTest } = res.data;
      setTestData(aptitudeTest);
      setTimeLeft(aptitudeTest.duration * 60);

      // Initialize empty answers object
      const initialAnswers = {};
      aptitudeTest.questions.forEach((q, index) => {
        initialAnswers[index] = q.type === 'multiple-choice' || q.type === 'true-false' 
          ? null 
          : '';
      });
      setAnswers(initialAnswers);

      // Store jobId and roundId from URL or from test data
      const finalJobId = jobIdParam || aptitudeTest.jobId;
      const finalRoundId = roundIdParam || aptitudeTest.roundId;
      
      // Fetch job and round info for context
      await fetchJobAndRoundInfo(finalJobId, finalRoundId);

      // Check if test is already completed
      await checkExistingAttempt(aptitudeTest._id);
    } catch (error) {
      console.error('[Aptitude Test] Error fetching test data:', error);
      console.error('[Aptitude Test] Error details:', error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        toast.error('Test not found or no longer available');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to access this test');
      } else {
        toast.error('Failed to load test. Please try again later.');
      }
      navigate('/candidate/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobAndRoundInfo = async (jobId, roundId) => {
    try {
      if (!jobId) {
        console.error('Missing jobId in fetchJobAndRoundInfo');
        return;
      }

      const res = await axios.get(`${PIPELINE_API_END_POINT}/job/${jobId}/my-progress`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        }
      });

      if (res.data.success) {
        const job = res.data.job;
        setJobData(job);
        
        // Log all interview rounds for debugging
        if (job.interviewRounds && Array.isArray(job.interviewRounds)) {
          console.log('Available interview rounds:', job.interviewRounds.map(r => ({
            id: r._id,
            name: r.name,
            type: r.type,
            testLink: r.aptitudeTestLink || 'none'
          })));
          
          // Try to find the round by ID first
          let round = null;
          if (roundId) {
            round = job.interviewRounds.find(r => r._id === roundId);
          }
          
          // If not found by ID, try to find by aptitude type
          if (!round) {
            round = job.interviewRounds.find(r => r.type === 'aptitude');
          }
          
          // If found, set the round data
          if (round) {
            console.log('Found matching round:', round);
            setRoundData(round);
          } else {
            console.warn('No matching round found for roundId:', roundId);
          }
        } else {
          console.warn('No interview rounds found in job data');
        }
      }
    } catch (error) {
      console.error('Error fetching job and round info:', error);
      if (error.response) {
        console.error('Response error data:', error.response.data);
      }
    }
  };

  const checkExistingAttempt = async (testId) => {
    try {
      console.log('[Aptitude Test] Checking for existing test attempt for ID:', testId);
      
      // Use the correct endpoint as defined in the backend router
      const endpoint = `${PIPELINE_API_END_POINT}/aptitude-test/${testId}/attempt`;
      console.log(`[Aptitude Test] Using attempt endpoint: ${endpoint}`);
      
      const res = await axios.get(endpoint, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.data.success && res.data.testAttempt) {
        console.log('[Aptitude Test] Found existing test attempt:', res.data.testAttempt);
        const { testAttempt } = res.data;
        if (testAttempt.completed) {
          setTestCompleted(true);
          setTestResult({
            score: testAttempt.score,
            percentageScore: testAttempt.percentageScore,
            passed: testAttempt.passed,
            completionTime: testAttempt.completionTime
          });
        } else {
          setTestStarted(true);
          if (testAttempt.answers) {
            setAnswers(testAttempt.answers);
          }
        }
      } else {
        console.log('[Aptitude Test] No existing test attempt found');
      }
    } catch (error) {
      console.error('[Aptitude Test] Error checking existing test attempt:', error);
      console.error('[Aptitude Test] Error details:', error.response?.data || error.message);
      // No need to show UI errors here, just log the issue
    }
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleOptionSelect = (questionIndex, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const startTest = () => {
    setTestStarted(true);
    // API call to record start time could be added here
  };

  const handleNextQuestion = () => {
    if (currentQuestion < testData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const isQuestionAnswered = (questionIndex) => {
    const answer = answers[questionIndex];
    if (answer === null || answer === undefined) return false;
    if (typeof answer === 'string' && answer.trim() === '') return false;
    return true;
  };

  const getAnsweredQuestionsCount = () => {
    return Object.values(answers).filter(a => a !== null && a !== undefined && a !== '').length;
  };

  const handleSubmitTest = async () => {
    try {
      setSubmitting(true);

      if (!testData || !testData._id) {
        toast.error('Invalid test data');
        return;
      }

      // Validate all answers are provided
      const unansweredQuestions = testData.questions.filter((_, index) => 
        !isQuestionAnswered(index)
      );

      if (unansweredQuestions.length > 0) {
        toast.error(`Please answer all questions (${unansweredQuestions.length} unanswered)`);
        return;
      }

      // Extract jobId and roundId from URL query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const jobIdParam = urlParams.get('jobId');
      const roundIdParam = urlParams.get('roundId');

      const payload = {
        answers,
        jobId: jobIdParam || testData.jobId,
        roundId: roundIdParam || testData.roundId
      };

      console.log('[Aptitude Test] Submitting test with payload:', payload);
      
      // Use the correct endpoint as defined in the backend router
      const submitEndpoint = `${PIPELINE_API_END_POINT}/aptitude-test/${testData._id}/submit`;
      console.log(`[Aptitude Test] Using submit endpoint: ${submitEndpoint}`);
      
      const res = await axios.post(
        submitEndpoint,
        payload,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (res.data.success) {
        console.log('[Aptitude Test] Submission successful:', res.data);
        setTestCompleted(true);
        setTestResult(res.data.result);
        toast.success('Test submitted successfully!');
      } else {
        console.error('[Aptitude Test] Submission failed with error:', res.data);
        toast.error(res.data.message || 'Failed to submit test');
      }
    } catch (error) {
      console.error('[Aptitude Test] Error submitting test:', error);
      console.error('[Aptitude Test] Error details:', error.response?.data || error.message);
      
      // More descriptive error message based on the error type
      if (error.response?.status === 404) {
        toast.error('The test submission endpoint was not found. Please contact support.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to submit this test.');
      } else if (error.response?.status === 500) {
        toast.error('Server error while submitting test. Please try again or contact support.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit test. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-10 px-4">
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading your test...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-10 px-4">
          <Card className="border-red-100 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-red-600">Test Not Available</CardTitle>
              <CardDescription>The requested test could not be loaded.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">This could be because:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>The test has expired</li>
                <li>You don't have permission to access this test</li>
                <li>The test ID is invalid</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => navigate('/candidate/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (testCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-10 px-4 pb-16">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="text-gray-600 mb-4 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{testData.title}</h1>
            <p className="text-gray-500 mt-2">{jobData?.title} • {roundData?.name}</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className={`mb-6 shadow-lg ${testResult.passed ? 'border-green-200' : 'border-red-200'}`}>
              <CardHeader className={`pb-2 ${testResult.passed ? 'bg-green-50' : 'bg-red-50'} rounded-t-lg border-b ${testResult.passed ? 'border-green-100' : 'border-red-100'}`}>
                <div className="flex items-center">
                  {testResult.passed ? (
                    <CheckCircle2 className="w-8 h-8 text-green-600 mr-3" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 mr-3" />
                  )}
                  <div>
                    <CardTitle className={`text-2xl ${testResult.passed ? 'text-green-800' : 'text-red-800'}`}>
                      Test {testResult.passed ? 'Passed' : 'Failed'}
                    </CardTitle>
                    <CardDescription className={testResult.passed ? 'text-green-700' : 'text-red-700'}>
                      Your score: {testResult.score} points ({testResult.percentageScore}%)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <Progress 
                  value={testResult.percentageScore} 
                  className={`h-3 ${testResult.passed ? 'bg-green-100' : 'bg-red-100'}`}
                  indicatorClassName={`transition-all duration-1000 ${testResult.passed ? 'bg-green-600' : 'bg-red-600'}`}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center">
                      <Award className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <div className="text-sm text-gray-500">Required passing score</div>
                        <div className="text-lg font-semibold">{testData.passingScore}%</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <div className="text-sm text-gray-500">Completion time</div>
                        <div className="text-lg font-semibold">
                          {new Date(testResult.completionTime).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-gray-50 rounded-b-lg">
                <div className="w-full text-center py-4">
                  <p className="text-gray-700 mb-4">
                    {testResult.passed 
                      ? 'Congratulations! You have successfully passed this aptitude test. We will notify you about the next steps soon.'
                      : 'Thank you for taking the test. Unfortunately, you did not meet the required passing score for this position.'}
                  </p>
                  <Button 
                    onClick={() => navigate('/candidate/dashboard')}
                    className={`${testResult.passed ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors`}
                  >
                    Return to Dashboard
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-10 px-4 pb-16">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="text-gray-600 mb-4 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{testData.title}</h1>
            <p className="text-gray-500 mt-2">{jobData?.title} • {roundData?.name}</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-6 shadow-lg border-blue-100">
              <CardHeader className="border-b bg-blue-50">
                <div className="flex items-center">
                  <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <CardTitle className="text-2xl text-blue-900">Test Instructions</CardTitle>
                    <CardDescription className="text-blue-700">Please read all instructions carefully before starting</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700 leading-relaxed">{testData.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border p-4 shadow-sm">
                      <div className="flex items-center">
                        <Timer className="w-5 h-5 text-blue-600 mr-2" />
                        <div>
                          <h4 className="font-medium text-gray-900">Duration</h4>
                          <p className="text-gray-500">{testData.duration} minutes</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border p-4 shadow-sm">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-600 mr-2" />
                        <div>
                          <h4 className="font-medium text-gray-900">Questions</h4>
                          <p className="text-gray-500">{testData.questions.length} questions</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border p-4 shadow-sm">
                      <div className="flex items-center">
                        <Award className="w-5 h-5 text-blue-600 mr-2" />
                        <div>
                          <h4 className="font-medium text-gray-900">Passing Score</h4>
                          <p className="text-gray-500">{testData.passingScore}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800 mb-2">Important Notes:</h4>
                        <ul className="list-disc list-inside text-amber-700 space-y-2">
                          <li>Once you start the test, the timer cannot be paused</li>
                          <li>Ensure you have a stable internet connection</li>
                          <li>Do not refresh the page or navigate away during the test</li>
                          <li>You can review and change your answers before final submission</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6 bg-gray-50">
                <Button 
                  onClick={startTest}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 text-lg transition-colors"
                >
                  Start Test
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentQuestionData = testData.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto pt-6 px-4 pb-16">
        {/* Timer and progress bar */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6 sticky top-4 z-10 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-gray-500 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-600" />
              Question {currentQuestion + 1} of {testData.questions.length}
            </div>
            <div className={`flex items-center font-mono text-lg ${
              timeLeft < 60 ? 'text-red-600 animate-pulse' : 
              timeLeft < 300 ? 'text-amber-600' : 'text-gray-700'
            }`}>
              <Timer className="h-5 w-5 mr-2" />
              {formatTime(timeLeft)}
            </div>
          </div>
          <Progress 
            value={(getAnsweredQuestionsCount() / testData.questions.length) * 100} 
            className="h-2 bg-blue-100"
            indicatorClassName="bg-blue-600 transition-all duration-300"
          />
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6 shadow-lg border-blue-100">
              <CardHeader className="pb-2 bg-blue-50 border-b">
                <CardTitle className="text-xl text-blue-900">{currentQuestionData.questionText}</CardTitle>
                <CardDescription className="text-blue-700">
                  {currentQuestionData.type === 'multiple-choice' ? 'Select one option' : 
                   currentQuestionData.type === 'true-false' ? 'Select True or False' : 
                   'Provide a short answer'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {(currentQuestionData.type === 'multiple-choice' || currentQuestionData.type === 'true-false') && (
                  <RadioGroup 
                    value={answers[currentQuestion]?.toString()} 
                    onValueChange={(value) => handleOptionSelect(currentQuestion, parseInt(value))}
                    className="space-y-3"
                  >
                    {currentQuestionData.options.map((option, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center space-x-2 bg-white border rounded-lg p-4 transition-all duration-200 ${
                          answers[currentQuestion]?.toString() === index.toString()
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                      >
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label 
                          htmlFor={`option-${index}`} 
                          className="flex-1 cursor-pointer py-1"
                        >
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestionData.type === 'short-answer' && (
                  <Textarea
                    value={answers[currentQuestion] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-[120px] border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4 bg-gray-50">
                <Button 
                  variant="outline" 
                  onClick={handlePrevQuestion}
                  disabled={currentQuestion === 0}
                  className={`transition-all duration-200 ${
                    currentQuestion === 0 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex gap-3">
                  {currentQuestion === testData.questions.length - 1 ? (
                    <Button 
                      onClick={handleSubmitTest}
                      className={`bg-green-600 hover:bg-green-700 text-white transition-colors ${
                        submitting ? 'opacity-75 cursor-wait' : ''
                      }`}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Submit Test
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleNextQuestion}
                      className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Question navigation */}
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Question Navigation</h3>
          <div className="flex flex-wrap gap-2">
            {testData.questions.map((_, index) => (
              <Button
                key={index}
                variant={currentQuestion === index ? 'default' : 'outline'}
                size="sm"
                className={`w-10 h-10 p-0 transition-all duration-200 ${
                  isQuestionAnswered(index) 
                    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                    : currentQuestion === index
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white hover:bg-gray-100'
                } ${
                  currentQuestion === index 
                    ? 'ring-2 ring-blue-500 shadow-md' 
                    : ''
                }`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AptitudeTest;