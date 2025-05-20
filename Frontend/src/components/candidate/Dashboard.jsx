import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '../shared/Navbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import {
  Bell, BookOpen, Briefcase, CheckCircle, ChevronRight, ClipboardCheck,
  Clock, FileText, XCircle, Award, CalendarClock, CircleCheck, AlertCircle, Circle,
  CalendarIcon, Building2, MapPin, DollarSign, ExternalLink, Sparkles
} from 'lucide-react';
import { APPLICATION_API_END_POINT, JOB_API_END_POINT, PIPELINE_API_END_POINT } from '@/utils/constant';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [applications, setApplications] = useState([]);
  const [pendingTests, setPendingTests] = useState([]);
  const [interviewJobs, setInterviewJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationProgress, setApplicationProgress] = useState({});

  const getStatusVariant = (status) => {
    switch (status) {
      case 'accepted':
      case 'accept':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'pending':
      case 'in_process':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleViewProgress = (jobId) => {
    if (!jobId) {
      toast.error('Job information not available');
      return;
    }
    navigate(`/candidate/job/${jobId}/progress`);
  };

  const handleStartTest = (testId) => {
    navigate(`/candidate/aptitude-test/${testId}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchApplications();
    };

    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (applications.length > 0) {
      fetchPendingTests();
    }
  }, [applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // console.log('Fetching applications...');

      const res = await axios.get(`${APPLICATION_API_END_POINT}/my-applications`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      // console.log('Applications response:', res.data);

      if (res.data.success) {
        const appList = Array.isArray(res.data.applications) ? res.data.applications : [];
        // console.log('Application list:', appList);
        
        const validApps = appList.filter(app => app.job);
        // console.log('Valid applications:', validApps.length);
        setApplications(validApps);
        
        // Get both accepted and in-process applications - check for both 'accept' and 'accepted'
        const activeApps = validApps.filter(app => 
          app.status === 'accepted' || 
          app.status === 'accept' || 
          app.status === 'in_process'
        );
        // console.log('Active applications:', activeApps);

        if (activeApps.length > 0) {
          const progressData = {};
          
          await Promise.all(activeApps.map(async (app) => {
            try {
              if (!app.job?._id) {
                console.log('Missing job data for application:', app);
                return;
              }

              // console.log('Fetching progress for job:', app.job._id);
              
              try {
                // Get application progress
                const progressRes = await axios.get(
                  `${APPLICATION_API_END_POINT}/progress/application/${app._id}`,
                  { 
                    withCredentials: true,
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  }
                );

                const progress = progressRes.data.progress;
                if (progress) {
                  progressData[app.job._id] = progress;
                  // console.log('Progress data received for job:', app.job._id, progress);
                } else {
                  console.log('No progress data received for job:', app.job._id);
                }
              } catch (progressError) {
                console.error(`Error fetching progress for job ${app.job?._id}:`, progressError);
                // Create fallback progress data to ensure UI shows something
                progressData[app.job._id] = {
                  currentRoundName: "Interview Process",
                  overallStatus: 'in_process',
                  totalRounds: 3,
                  completedRounds: 1
                };
              }
            } catch (error) {
              console.error(`Error processing application ${app._id}:`, error);
            }
          }));
          
          // console.log('Setting progress data:', progressData);
          setApplicationProgress(progressData);
        }
      } else {
        console.log('Failed to fetch applications:', res.data.message);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTests = async () => {
    try {
      if (!applications.length) {
        console.log('No applications found');
        setPendingTests([]);
        return;
      }

      const validApplications = applications.filter(app => app.job?._id);
      
      if (!validApplications.length) {
        console.log('No valid applications with job data');
        setPendingTests([]);
        return;
      }

      const response = await axios.get(`${PIPELINE_API_END_POINT}/pending-aptitude-tests`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const validPendingTests = response.data.pendingTests.filter(test => {
          return validApplications.some(app => app.job._id === test.jobId);
        });
        setPendingTests(validPendingTests);
      }
    } catch (error) {
      console.error('Error fetching pending tests:', error);
      setPendingTests([]);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'accept':
        return <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Accepted</Badge>;
      case 'reject':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      case 'hired':
        return <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-800"><Award className="w-3 h-3" /> Hired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInterviewStatusInfo = (job) => {
    if (!job || !job._id || !applicationProgress[job._id]) {
      return {
        icon: <Clock className="w-4 h-4" />,
        text: "Not started",
        color: "text-gray-500"
      };
    }

    const progress = applicationProgress[job._id];

    // Handle case where application is accepted but pipeline not started
    if (!progress.currentRound || !progress.roundsStatus || progress.roundsStatus.length === 0) {
      return {
        icon: <Clock className="w-4 h-4" />,
        text: "Starting Aptitude Round",
        color: "text-blue-500"
      };
    }

    if (pendingTests && Array.isArray(pendingTests) && pendingTests.some(test => test && test.jobId === job._id)) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: "Aptitude Test Required",
        color: "text-orange-500"
      };
    }

    if (progress && progress.nextInterviewDate) {
      return {
        icon: <CalendarClock className="w-4 h-4" />,
        text: `Interview on ${new Date(progress.nextInterviewDate).toLocaleDateString()}`,
        color: "text-blue-500"
      };
    }

    return {
      icon: <Clock className="w-4 h-4" />,
      text: "In Progress",
      color: "text-gray-500"
    };
  };

  // Add a helper function to check if a test is truly pending
  const isTestTrulyPending = (testId, jobId) => {
    // If no test ID, it's definitely not pending
    if (!testId) return false;
    
    // Check if user is already hired for this job
    const progress = applicationProgress[jobId];
    if (progress && progress.overallStatus === 'hired') {
      return false;
    }
    
    // Check if the aptitude round is already completed (either passed or failed)
    if (progress && progress.roundsStatus) {
      const aptitudeRound = progress.roundsStatus.find(round => 
        round.type === 'aptitude' || // Check by round type
        (testId && round.testId === testId) // Or match by specific test ID if we have it
      );
      
      if (aptitudeRound && (aptitudeRound.status === 'passed' || aptitudeRound.status === 'failed')) {
        return false;
      }
    }
    
    return true;
  };

  const renderApplications = () => {
    return applications.map((application) => {
      const pendingTest = pendingTests?.find(test => test.jobId === application.job?._id);
      const jobId = application.job?._id;
      const progress = applicationProgress[jobId];
      
      // Check if we should show the Take Aptitude Test button
      const shouldShowTestButton = 
        application.status === 'accepted' && 
        pendingTest && 
        isTestTrulyPending(pendingTest.testId, jobId) &&
        !(progress && progress.overallStatus === 'hired');
      
      return (
        <div key={application._id} className="bg-white p-6 rounded-lg shadow-sm border mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {application.job?.title || 'Job Title Not Available'}
              </h3>
              <p className="text-sm text-gray-500">
                {application.job?.company?.name || 'Unknown Company'}
              </p>
            </div>
            <Badge variant={getStatusVariant(application.status)}>
              {application.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/description/${application.job?._id}`)}
            >
              View Job
            </Button>

            <Button
              variant="outline"
              className="bg-blue-50 text-blue-700 hover:bg-blue-100"
              onClick={() => handleViewProgress(application.job?._id)}
            >
              View Progress
            </Button>

            {shouldShowTestButton && (
              <Button
                onClick={() => navigate(`/candidate/aptitude-test/${pendingTest.testId}?jobId=${pendingTest.jobId}&roundId=${pendingTest.roundId}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Take Aptitude Test
              </Button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <Navbar />
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Welcome Section with Stats */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Welcome back, {user?.fullname || 'Candidate'}
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Track your journey to success</p>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={() => navigate('/jobs')} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20"
              >
                Browse Jobs
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-50">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <h3 className="text-2xl font-bold text-gray-900">{applications?.length || 0}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg shadow-green-500/5 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-50">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Interviews</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {applications?.filter(app => app.status === 'accepted' || app.status === 'accept').length || 0}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg shadow-orange-500/5 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-50">
                    <ClipboardCheck className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Tests</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {pendingTests?.filter(test => isTestTrulyPending(test.testId, test.jobId)).length || 0}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pending Tests Notification */}
        {(() => {
          const trulyPendingTests = pendingTests?.filter(test => isTestTrulyPending(test.testId, test.jobId)) || [];
          
          if (trulyPendingTests.length > 0) {
            return (
              <Card className="mb-12 bg-gradient-to-r from-orange-50 to-orange-100/50 border-none shadow-lg shadow-orange-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-orange-900">
                    <Bell className="text-orange-600" />
                    Pending Aptitude Tests
                  </CardTitle>
                  <CardDescription className="text-orange-800">
                    You have {trulyPendingTests.length} pending aptitude test{trulyPendingTests.length > 1 ? 's' : ''} to complete
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {trulyPendingTests.map(test => (
                      <div key={test.jobId} className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-all duration-200">
                        <div>
                          <p className="font-medium text-gray-900">{test.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Building2 className="h-4 w-4 text-orange-500" />
                            <span className="text-sm text-gray-600">{test.company}</span>
                          </div>
                          <Badge variant="outline" className="mt-2 bg-orange-50 text-orange-700 border-orange-200">
                            {test.roundName}
                          </Badge>
                        </div>
                        <Button 
                          onClick={() => navigate(`/candidate/aptitude-test/${test.testId}`)}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20"
                        >
                          Take Test
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          }
          return null;
        })()}

        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="mb-8 bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-lg shadow-blue-500/5">
            <TabsTrigger 
              value="applications" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg"
            >
              <Briefcase className="h-4 w-4" /> Applications
            </TabsTrigger>
            <TabsTrigger 
              value="interviews" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg"
            >
              <ClipboardCheck className="h-4 w-4" /> Interview Progress
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg"
            >
              <BookOpen className="h-4 w-4" /> Saved Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg shadow-blue-500/5">
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Your Applications
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Track the status of your job applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  </div>
                ) : applications && applications.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {applications.map((application) => {
                      const pendingTest = pendingTests?.find(test => test.jobId === application.job?._id);
                      const jobId = application.job?._id;
                      const progress = applicationProgress[jobId];
                      
                      const shouldShowTestButton = 
                        application.status === 'accepted' && 
                        pendingTest && 
                        isTestTrulyPending(pendingTest.testId, jobId) &&
                        !(progress && progress.overallStatus === 'hired');
                      
                      return (
                        <div key={application._id} className="group bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {application.job?.title || 'Job Title Not Available'}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Building2 className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-gray-600">{application.job?.company?.name || 'Unknown Company'}</span>
                              </div>
                            </div>
                            <Badge variant={getStatusVariant(application.status)} className="ml-2">
                              {application.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                              <MapPin className="h-4 w-4 text-blue-500" />
                              <span className="truncate">{application.job?.jobLocation || "India"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span className="truncate">{application.job?.salary} LPA</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/description/${application.job?._id}`)}
                              className="text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                            >
                              View Job
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                              onClick={() => handleViewProgress(application.job?._id)}
                            >
                              View Progress
                            </Button>

                            {shouldShowTestButton && (
                              <Button
                                size="sm"
                                onClick={() => navigate(`/candidate/aptitude-test/${pendingTest.testId}?jobId=${pendingTest.jobId}&roundId=${pendingTest.roundId}`)}
                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20"
                              >
                                Take Aptitude Test
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Alert className="bg-blue-50/80 backdrop-blur-sm border-blue-200">
                    <AlertTitle className="text-blue-800">No applications found</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      You haven't applied to any jobs yet. Browse available jobs to get started.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interviews">
            <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg shadow-blue-500/5">
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Interview Progress
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Track your progress through interview rounds
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  </div>
                ) : applications.filter(app => app.status === 'accept' || app.status === 'accepted').length > 0 ? (
                  <div className="space-y-4">
                    {applications.filter(app => app.status === 'accept' || app.status === 'accepted').map((application) => {
                      if (!application || !application.job) return null;
                      
                      let progress = applicationProgress[application.job._id];
                      const hasStartedInterview = progress?.roundsStatus?.some(round => 
                        round.status === 'passed' || round.status === 'failed' || round.status === 'in_process'
                      );
                      
                      const pendingTest = pendingTests?.find(test => test.jobId === application.job._id);
                      const shouldShowTestButton = 
                        pendingTest && 
                        isTestTrulyPending(pendingTest.testId, application.job._id) &&
                        progress?.overallStatus !== 'hired' && 
                        progress?.overallStatus !== 'rejected';

                      // For applications that haven't started their first round
                      if (!hasStartedInterview) {
                        return (
                          <div key={application._id} className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-200 transition-all duration-200">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {application.job.title || 'Untitled Job'}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Building2 className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm text-gray-600">{application.job.company?.name || 'Unknown Company'}</span>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                                Application Accepted
                              </Badge>
                            </div>

                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Progress (1/1 rounds)</span>
                                <span className="text-sm text-gray-500">100%</span>
                              </div>
                              <Progress value={100} className="h-2 bg-gray-100" />
                            </div>

                            <div className="mb-4">
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Waiting to start - Score: 0%</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/description/${application.job._id}`)}
                                className="text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                              >
                                View Job
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                onClick={() => handleViewProgress(application.job._id)}
                              >
                                View Progress
                              </Button>
                              {shouldShowTestButton && (
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/candidate/aptitude-test/${pendingTest.testId}?jobId=${pendingTest.jobId}&roundId=${pendingTest.roundId}`)}
                                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                                >
                                  Take Aptitude Test
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // For applications that have started interviews
                      const roundsData = progress?.roundsStatus || [];
                      const totalRounds = progress?.totalRounds || roundsData.length || 3;
                      const completedRounds = progress?.completedRounds || roundsData.filter(r => r.status === 'passed').length || 0;
                      const progressPercentage = totalRounds > 0 ? Math.round((completedRounds / totalRounds) * 100) : 0;

                      return (
                        <div key={application._id} className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-200 transition-all duration-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {application.job.title || 'Untitled Job'}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Building2 className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-gray-600">{application.job.company?.name || 'Unknown Company'}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                              {progress?.overallStatus === 'hired' ? 'Hired' : 
                               progress?.overallStatus === 'rejected' ? 'Rejected' : 'In Progress'}
                            </Badge>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Progress ({completedRounds}/{totalRounds} rounds)</span>
                              <span className="text-sm text-gray-500">{progressPercentage}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2 bg-gray-100" />
                          </div>

                          <div className="space-y-2 mb-4">
                            {roundsData.sort((a, b) => (a.order || 0) - (b.order || 0)).map((round, idx) => (
                              <div key={round.roundId || `round-${idx}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                {round.status === 'pending' ? (
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                ) : round.status === 'passed' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : round.status === 'failed' ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-gray-300" />
                                )}
                                <div className="flex-1">
                                  <span className="text-sm text-gray-900">{round.name || `Round ${idx + 1}`}</span>
                                  {round.type === 'aptitude' && round.score !== undefined && (
                                    <span className="text-sm text-gray-600 ml-2">- Score: {round.score}%</span>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {round.status === 'pending' ? 'Pending' : 
                                   round.status === 'passed' ? 'Passed' : 
                                   round.status === 'failed' ? 'Failed' : 'Not Started'}
                                </Badge>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/description/${application.job._id}`)}
                              className="text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                            >
                              View Job
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                              onClick={() => handleViewProgress(application.job._id)}
                            >
                              View Progress
                            </Button>
                            {shouldShowTestButton && (
                              <Button
                                size="sm"
                                onClick={() => navigate(`/candidate/aptitude-test/${pendingTest.testId}?jobId=${pendingTest.jobId}&roundId=${pendingTest.roundId}`)}
                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                              >
                                Take Aptitude Test
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Alert className="bg-blue-50/80 backdrop-blur-sm border-blue-200">
                    <AlertTitle className="text-blue-800">No interview processes found</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      You aren't currently in any interview pipelines. Applications need to be accepted before you enter the interview process.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved">
            <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg shadow-blue-500/5">
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Saved Jobs
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Jobs you've saved for later
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="bg-blue-50/80 backdrop-blur-sm border-blue-200">
                  <AlertTitle className="text-blue-800">Coming Soon</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    This feature is still under development. Check back later!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;