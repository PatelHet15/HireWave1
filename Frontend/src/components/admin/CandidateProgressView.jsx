import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '../shared/Navbar';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { ArrowLeft, CheckCircle, XCircle, Clock, Mail, Phone, FileText, AlertCircle } from 'lucide-react';
import { PIPELINE_API_END_POINT, JOB_API_END_POINT, USER_API_END_POINT, APPLICATION_API_END_POINT } from '@/utils/constant';

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

const CandidateProgressView = () => {
  const { candidateId, jobId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [application, setApplication] = useState(null);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data for job', jobId, 'and candidate', candidateId);
      
      // Fetch job details
      const jobResponse = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!jobResponse.data.success) {
        throw new Error(jobResponse.data.message || 'Failed to fetch job details');
      }
      setJob(jobResponse.data.job);
      console.log('Job data fetched successfully:', jobResponse.data.job.title);
      
      // Try to fetch application data as a fallback data source
      try {
        const applicationResponse = await axios.get(`${APPLICATION_API_END_POINT}/job/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (applicationResponse.data && applicationResponse.data.success) {
          const applications = applicationResponse.data.applications || [];
          const candidateApp = applications.find(app => app.applicant?._id === candidateId);
          if (candidateApp) {
            setApplication(candidateApp);
            console.log('Application data found for candidate');
          }
        }
      } catch (appError) {
        console.warn('Could not fetch application data:', appError);
      }
      
      // Try to get candidate information
      let candidateData = null;
      try {
        console.log('Fetching candidate data from:', `${USER_API_END_POINT}/candidate/${candidateId}`);
        const candidateResponse = await axios.get(`${USER_API_END_POINT}/candidate/${candidateId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (candidateResponse.data && candidateResponse.data.success) {
          candidateData = candidateResponse.data.candidate;
          setCandidate(candidateData);
          console.log('Candidate data fetched successfully');
        }
      } catch (candidateError) {
        console.warn('Could not fetch candidate data directly:', candidateError);
        
        // Create fallback candidate object
        if (application && application.applicant) {
          // Use applicant data from application
          candidateData = {
            _id: application.applicant._id,
            fullname: application.applicant.fullname || application.applicant.name || 'Unknown Candidate',
            email: application.applicant.email || 'No email available',
            profile: application.applicant.profile || {},
            phoneNumber: application.applicant.phoneNumber
          };
          setCandidate(candidateData);
          console.log('Using application applicant data as fallback');
        } else {
          // Create minimal candidate object
          candidateData = {
            _id: candidateId,
            fullname: 'Candidate',
            email: 'No email available',
            profile: {}
          };
          setCandidate(candidateData);
          console.log('Created minimal candidate fallback object');
          toast.warning('Limited candidate data available');
        }
      }
      
      // Now try to fetch progress data
      try {
        const progressUrl = `${PIPELINE_API_END_POINT}/job/${jobId}/candidate/${candidateId}/progress`;
        console.log('Fetching progress data from:', progressUrl);
        
        const progressResponse = await axios.get(progressUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (progressResponse.data.success) {
          console.log('Progress data fetched successfully');
          const progressData = progressResponse.data.progress;
          setProgress(progressData);
          
          // Update candidate with applicant data from progress if needed
          if (!candidateData && progressData.applicant) {
            setCandidate(progressData.applicant);
            console.log('Using progress applicant data');
          }
        } else {
          console.warn('Progress data response was not successful', progressResponse.data);
          throw new Error(progressResponse.data.message || 'Failed to fetch progress data');
        }
      } catch (progressError) {
        console.error('Error fetching progress:', progressError);
        
        // Create default progress if it doesn't exist
        const defaultProgress = {
          applicant: candidateData,
          currentRound: job.interviewRounds?.length > 0 ? job.interviewRounds[0]._id : null,
          overallStatus: application ? application.overallStatus || 'pending' : 'pending',
          lastUpdated: new Date(),
          rounds: job.interviewRounds?.map(round => ({
            _id: round._id,
            name: round.name,
            type: round.type,
            status: 'pending',
            feedback: '',
          })) || []
        };
        
        setProgress(defaultProgress);
        toast.warning('No progress data found. Showing application status.');
      }
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
      toast.error(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [candidateId, jobId]);

  
  const sendEmailToCandidate = () => {
    if (candidate?.email) {
      window.open(`mailto:${candidate.email}?subject=Regarding your application for ${job?.title}`, '_blank');
    } else {
      toast.error('No email address available for this candidate');
    }
  };
  
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="max-w-5xl mx-auto pt-10 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="max-w-5xl mx-auto pt-10 px-4">
          <Card className="border border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <div>
                  <CardTitle className="text-red-700">Error Loading Candidate Progress</CardTitle>
                  <CardDescription className="text-red-600">
                    {error}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-red-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Technical Details</h3>
                  <p className="text-sm text-gray-600">
                    Failed to fetch data from: {PIPELINE_API_END_POINT}/job/{jobId}/candidate/{candidateId}/progress
                  </p>
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/admin/jobs/pipeline/${jobId}/candidates`)}
                  >
                    Back to Candidates
                  </Button>
                  <Button onClick={fetchData}>
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="max-w-5xl mx-auto pt-10 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-red-500">Job Information Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p>We couldn't find the job information requested.</p>
              <p className="text-sm text-gray-500 mt-2">
                This might happen if the job has been deleted or is no longer available.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate('/admin/jobs')}>
                Return to Jobs
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!candidate) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="max-w-5xl mx-auto pt-10 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-red-500">Candidate Information Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p>We couldn't find the candidate information requested.</p>
              <p className="text-sm text-gray-500 mt-2">
                This might happen if the candidate account has been deleted.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate(`/admin/jobs/pipeline/${jobId}/candidates`)}>
                Return to Candidates
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto pt-8 pb-16 px-4">
        <Button 
          variant="ghost" 
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center"
          onClick={() => navigate(`/admin/jobs/pipeline/${jobId}/candidates`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Candidates
        </Button>
        
        {/* Candidate Profile */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-gray-200">
                  <AvatarImage src={candidate.profile?.profilePhoto} alt={candidate.fullname} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-medium text-xl">
                    {candidate.fullname?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{candidate.fullname}</CardTitle>
                  <CardDescription>{candidate.profile?.preferredRole || application?.appliedPosition || 'Candidate'}</CardDescription>
                  <div className="flex items-center gap-4 mt-2">
                    <a 
                      href={`mailto:${candidate.email}`} 
                      className="text-sm text-gray-500 hover:text-blue-600 flex items-center"
                    >
                      <Mail className="w-4 h-4 mr-1.5" /> {candidate.email}
                    </a>
                    {candidate.phoneNumber && (
                      <a 
                        href={`tel:${candidate.phoneNumber}`} 
                        className="text-sm text-gray-500 hover:text-blue-600 flex items-center"
                      >
                        <Phone className="w-4 h-4 mr-1.5" /> {candidate.phoneNumber}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              {/* <Badge className={`${StatusConfig[progress.overallStatus]?.color || 'bg-gray-100'} border px-3 py-1 text-sm`}>
                <span className="flex items-center">
                  {StatusConfig[progress.overallStatus]?.icon || <Clock className="w-4 h-4 mr-1.5" />}
                  <span className="ml-1.5">{StatusConfig[progress.overallStatus]?.label || 'Unknown'}</span>
                </span>
              </Badge> */}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Applied Position</h3>
                <p className="font-medium">{job.title}</p>
              </div>
              {/* <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Application Date</h3>
                <p className="font-medium">{application?.createdAt ? new Date(application.createdAt).toLocaleDateString() : "Unknown"}</p>
              </div> */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Current Round</h3>
                <p className="font-medium">
                  {job.interviewRounds?.find(r => r._id === progress.currentRound)?.name || application?.currentStage || 'N/A'}
                </p>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="font-medium mb-3">Candidate Summary</h3>
                <p className="text-gray-600 text-sm">
                  {candidate.profile?.bio || 'No summary provided by the candidate.'}
                </p>
                
                {candidate.profile?.resume && (
                  <a 
                    href={candidate.profile.resume} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <FileText className="w-4 h-4 mr-1.5" /> View Resume
                  </a>
                )}
              </div>
              
              <div className="w-full md:w-64">
                <h3 className="font-medium mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.profile?.skills?.length > 0 ? (
                    candidate.profile.skills.map((skill, i) => (
                      <Badge key={i} variant="outline" className="bg-blue-50">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No skills listed</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="border-t pt-4 flex justify-end">
            <Button onClick={sendEmailToCandidate} variant="outline" className="gap-2">
              <Mail className="w-4 h-4" /> Email Candidate
            </Button>
          </CardFooter>
        </Card>
        
        {/* Progress Timeline */}
        <h2 className="text-xl font-semibold mb-4">Interview Progress</h2>
        <div className="space-y-4">
          {progress.rounds?.map((round, index) => {
            const roundDetails = job.interviewRounds?.find(r => r._id === round._id);
            const statusInfo = StatusConfig[round.status] || StatusConfig.pending;
            
            return (
              <Card key={round._id || index} className="border">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="flex items-center justify-center bg-blue-100 text-blue-800 rounded-full w-6 h-6 text-xs font-semibold mr-3">
                        {index + 1}
                      </span>
                      <CardTitle className="text-lg">{roundDetails?.name || round.name || 'Unknown Round'}</CardTitle>
                    </div>
                    <Badge className={`${statusInfo.color} border`}>
                      <span className="flex items-center">
                        {statusInfo.icon}
                        <span className="ml-1.5">{statusInfo.label}</span>
                      </span>
                    </Badge>
                  </div>
                  <CardDescription className="ml-9 capitalize">{roundDetails?.type || round.type || 'interview'} Round</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="ml-9">
                    <p className="text-gray-600 mb-4">{roundDetails?.description || 'No description provided.'}</p>
                    
                    {round.status !== 'pending' && (
                      <div className={`p-4 rounded-lg ${
                        round.status === 'passed' ? 'bg-green-50' : 
                        round.status === 'failed' ? 'bg-red-50' : 'bg-gray-50'
                      }`}>
                        {round.feedback && (
                          <>
                            <h4 className={`font-medium ${
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
                          </>
                        )}
                        
                        {round.score !== undefined && round.score !== null && (
                          <div className="mt-2">
                            <span className={`text-sm font-medium ${
                              round.status === 'passed' ? 'text-green-700' : 
                              round.status === 'failed' ? 'text-red-700' : 'text-gray-700'
                            }`}>
                              Score: {round.score}%
                            </span>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2">
                          Updated: {new Date(round.updatedAt || Date.now()).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Overall Assessment */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Overall Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {progress.overallStatus === 'hired' ? 
                "This candidate has successfully completed all interview rounds and has been marked as hired." :
                progress.overallStatus === 'rejected' ?
                "This candidate did not meet the requirements for this position." :
                "This candidate is currently in the interview process. Review their progress through each round to make hiring decisions."}
            </p>
            
            {progress.overallFeedback && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800">Final Feedback</h4>
                <p className="mt-1 text-sm text-gray-600">{progress.overallFeedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateProgressView;