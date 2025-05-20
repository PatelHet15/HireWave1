import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '../shared/Navbar';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, ExternalLink } from 'lucide-react';
import { useSelector } from 'react-redux';
import { PIPELINE_API_END_POINT, JOB_API_END_POINT } from '@/utils/constant';

// Status badge colors and icons
const StatusConfig = {
  pending: { 
    color: "bg-gray-100 text-gray-800 border-gray-200", 
    icon: <Clock className="w-4 h-4 text-gray-600" />,
    label: "Pending"
  },
  in_progress: { 
    color: "bg-blue-100 text-blue-800 border-blue-200", 
    icon: <Clock className="w-4 h-4 text-blue-600" />,
    label: "In Progress"
  },
  awaiting_review: { 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    icon: <Clock className="w-4 h-4 text-yellow-600" />,
    label: "Awaiting Review"
  },
  passed: { 
    color: "bg-green-100 text-green-800 border-green-200", 
    icon: <CheckCircle className="w-4 h-4 text-green-600" />,
    label: "Passed"
  },
  failed: { 
    color: "bg-red-100 text-red-800 border-red-200", 
    icon: <XCircle className="w-4 h-4 text-red-600" />,
    label: "Failed"
  }
};

const CandidateProgress = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activeRoundId, setActiveRoundId] = useState(null);
  
  useEffect(() => {
    fetchProgressData();
  }, [jobId, user]);
  
  const fetchProgressData = async () => {
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
      }
      
      // Fetch candidate's progress
      const progressRes = await axios.get(`${PIPELINE_API_END_POINT}/job/${jobId}/progress`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        }
      });
      
      if (progressRes.data.success) {
        setProgress(progressRes.data.progress);
        // Find the active round
        const currentRound = progressRes.data.progress?.rounds?.find(r => r.status !== 'passed' && r.status !== 'failed');
        if (currentRound) {
          setActiveRoundId(currentRound._id);
        }
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast.error(error.response?.data?.message || 'Failed to load your progress');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartAptitudeTest = (roundId) => {
    // Find the test details from the progress data
    const round = progress?.rounds?.find(r => r._id === roundId);
    if (round?.aptitudeTest) {
      navigate(`/candidate/aptitude-test/${round.aptitudeTest}`);
    } else {
      toast.error('Aptitude test is not available at this time.');
    }
  };
  
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-10 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!job || !progress) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-10 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-red-500">Information Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p>We couldn't find your progress information for this job. You may not have applied to this job or there might be an issue with your application.</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate('/candidate/applications')}>View My Applications</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto pt-8 pb-16 px-4">
        <Button 
          variant="ghost" 
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center"
          onClick={() => navigate('/candidate/applications')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Applications
        </Button>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Application Progress</h1>
          <p className="text-gray-500 mt-1">{job.title} at {job.companyName}</p>
        </div>
        
        {/* Overall Status Card */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Your Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge className={`${StatusConfig[progress.overallStatus]?.color || 'bg-gray-100'} border px-3 py-1 text-sm`}>
                  <span className="flex items-center">
                    {StatusConfig[progress.overallStatus]?.icon || <Clock className="w-4 h-4 mr-1.5" />}
                    <span className="ml-1.5">{StatusConfig[progress.overallStatus]?.label || 'Unknown'}</span>
                  </span>
                </Badge>
                <p className="mt-3 text-gray-600">
                  {progress.overallStatus === 'passed' ? 
                    "Congratulations! You've successfully completed all the interview rounds. The hiring team will contact you soon with next steps." :
                    progress.overallStatus === 'failed' ?
                    "Unfortunately, your application didn't progress further. Thank you for your interest in this position." :
                    "Your application is being reviewed. Please complete any pending tasks to progress to the next stage."}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500">Applied on</div>
                <div className="font-medium">{new Date(progress.createdAt).toLocaleDateString()}</div>
                <div className="text-sm text-gray-500 mt-2">Last updated</div>
                <div className="font-medium">{new Date(progress.lastUpdated).toLocaleDateString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Interview Rounds */}
        <h2 className="text-xl font-semibold mb-4">Interview Process</h2>
        <div className="space-y-4">
          {progress.rounds.map((round, index) => {
            const isActive = round._id === activeRoundId;
            const roundStatus = StatusConfig[round.status] || StatusConfig.pending;
            const hasFeedback = round.feedback && round.status !== 'pending';
            const isAptitudeTest = round.type === 'aptitude';
            
            return (
              <Card 
                key={round._id} 
                className={`border ${isActive ? 'border-blue-300 shadow-md' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="flex items-center justify-center bg-blue-100 text-blue-800 rounded-full w-6 h-6 text-xs font-semibold mr-3">
                        {index + 1}
                      </span>
                      <CardTitle className="text-lg">{round.name}</CardTitle>
                    </div>
                    <Badge className={`${roundStatus.color} border`}>
                      <span className="flex items-center">
                        {roundStatus.icon}
                        <span className="ml-1.5">{roundStatus.label}</span>
                      </span>
                    </Badge>
                  </div>
                  <CardDescription className="ml-9 capitalize">{round.type} Round</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="ml-9">
                    <p className="text-gray-600">{round.description || `This round evaluates your ${round.type} skills.`}</p>
                    
                    {isAptitudeTest && (round.status === 'pending' || round.status === 'in_progress') && (
                      <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Aptitude Test Required
                        </h4>
                        <p className="mt-1 text-sm text-blue-700">
                          You need to complete an aptitude test as part of this round. The test has a time limit and must be completed in one sitting.
                        </p>
                        <div className="mt-4">
                          <Button
                            onClick={() => handleStartAptitudeTest(round._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Start Aptitude Test
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {isAptitudeTest && round.status === 'passed' && round.score && (
                      <div className="mt-4 bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Test Completed
                        </h4>
                        <p className="mt-1 text-sm text-green-700">
                          You have successfully completed the aptitude test with a score of {round.score}%.
                        </p>
                      </div>
                    )}
                    
                    {isAptitudeTest && round.status === 'failed' && round.score && (
                      <div className="mt-4 bg-red-50 p-4 rounded-lg">
                        <h4 className="font-medium text-red-800 flex items-center">
                          <XCircle className="w-4 h-4 mr-2" />
                          Test Failed
                        </h4>
                        <p className="mt-1 text-sm text-red-700">
                          Unfortunately, you did not pass the aptitude test. Your score was {round.score}%.
                        </p>
                      </div>
                    )}
                    
                    {hasFeedback && (
                      <div className={`mt-4 p-4 rounded-lg ${
                        round.status === 'passed' ? 'bg-green-50' : 
                        round.status === 'failed' ? 'bg-red-50' : 'bg-gray-50'
                      }`}>
                        <h4 className={`font-medium flex items-center ${
                          round.status === 'passed' ? 'text-green-800' : 
                          round.status === 'failed' ? 'text-red-800' : 'text-gray-800'
                        }`}>
                          Feedback
                        </h4>
                        <p className={`mt-1 text-sm ${
                          round.status === 'passed' ? 'text-green-700' : 
                          round.status === 'failed' ? 'text-red-700' : 'text-gray-700'
                        }`}>
                          {round.feedback}
                        </p>
                        
                        {round.score !== undefined && round.score !== null && (
                          <div className="mt-2 flex items-center">
                            <span className={`text-sm font-medium ${
                              round.status === 'passed' ? 'text-green-700' : 
                              round.status === 'failed' ? 'text-red-700' : 'text-gray-700'
                            }`}>
                              Score: {round.score}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Next Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            {progress.overallStatus === 'in_process' ? (
              <div>
                <p className="text-gray-600">
                  {activeRoundId ? 
                    "You're currently in the interview process. Please complete any pending tasks for your current round and wait for the recruiter's feedback." :
                    "Your application is being processed. The recruiter will update you on the next steps soon."}
                </p>
                <div className="mt-4 space-y-3">
                  <h4 className="font-medium">Tips for success:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    <li>Check your email regularly for updates from the recruiter</li>
                    <li>Prepare for upcoming interviews by researching the company</li>
                    <li>Review your skills and experiences relevant to the job description</li>
                    <li>Test your video conferencing setup if you have remote interviews</li>
                  </ul>
                </div>
              </div>
            ) : progress.overallStatus === 'hired' ? (
              <p className="text-gray-600">
                Congratulations on your new role! The hiring team will contact you with details about onboarding and your start date. We're excited to have you join the team!
              </p>
            ) : progress.overallStatus === 'rejected' ? (
              <p className="text-gray-600">
                Thank you for your interest in this position. We encourage you to apply for other suitable positions that match your skills and experience.
              </p>
            ) : (
              <p className="text-gray-600">
                The hiring team is reviewing your application. Please check back later for updates on your application status.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateProgress; 