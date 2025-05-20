import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '../shared/Navbar';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Briefcase,
  Building,
  AlertCircle,
  Calendar,
  Award,
  ScrollText,
  ChevronRight,
  CircleCheck,
  Circle
} from 'lucide-react';

import { APPLICATION_API_END_POINT, JOB_API_END_POINT, PIPELINE_API_END_POINT } from '../../utils/constant';

const InterviewProgress = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [progress, setProgress] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [applicationId, setApplicationId] = useState(null);

  // First get the application ID
  useEffect(() => {
    const getApplicationId = async () => {
      try {
        console.log('Getting application for job:', jobId);
        const res = await axios.get(`${APPLICATION_API_END_POINT}/check/${jobId}`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        console.log('Application check response:', res.data);

        if (res.data.success) {
          if (res.data.hasApplied && res.data.application) {
            setApplicationId(res.data.application._id);
            console.log('Application ID set:', res.data.application._id);
          } else {
            toast.error('You have not applied for this job');
            navigate('/candidate/dashboard');
          }
        } else {
          toast.error('Failed to check application status');
        }
      } catch (error) {
        console.error('Error getting application:', error);
        toast.error('Failed to get application details');
      }
    };

    if (jobId) {
      getApplicationId();
    }
  }, [jobId, navigate]);

  // Then fetch progress once we have the application ID
  useEffect(() => {
    if (applicationId) {
      console.log('Fetching job progress for applicationId:', applicationId);
      fetchJobProgress();
    }
  }, [applicationId]);

  useEffect(() => {
    if (job?.interviewRounds) {
      const sortedRounds = [...job.interviewRounds].sort((a, b) => a.order - b.order);
      setRounds(sortedRounds);
      console.log('Setting sorted rounds:', sortedRounds);
      console.log('Current progress:', progress);
    }
  }, [job, progress]);

  useEffect(() => {
    // Always print the current round aptitude test info, even if values are missing
    let roundId = null;
    let roundName = null;
    let aptitudeTestId = null;
    let hasAptitudeTest = false;
    if (progress?.currentRound && Array.isArray(rounds)) {
      const current = rounds.find(r => String(r._id) === String(progress.currentRound));
      if (current) {
        roundId = typeof current._id === 'object' ? JSON.stringify(current._id) : String(current._id);
        roundName = typeof current.name === 'object' ? JSON.stringify(current.name) : String(current.name);
        aptitudeTestId = current.aptitudeTest ? String(current.aptitudeTest) : null;
        hasAptitudeTest = Boolean(current.aptitudeTest);
      }
    }
    console.log('[Current Round Aptitude Test]', {
      roundId,
      roundName,
      hasAptitudeTest,
      aptitudeTestId
    });
  }, [progress, rounds]);

  const fetchJobProgress = async () => {
    try {
      setLoading(true);

      if (!jobId || !applicationId) {
        toast.error('Missing job ID or application ID');
        setLoading(false);
        return;
      }

      // Get application progress with populated job data
      const progressRes = await axios.get(`${APPLICATION_API_END_POINT}/progress/application/${applicationId}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('API Response:', progressRes.data);

      if (progressRes.data.success) {
        const progress = progressRes.data.progress;
        setProgress(progress);
        console.log('Application progress:', progress);

        // Set job data from the populated application
        if (progress.job) {
          setJob(progress.job);
          console.log('Job:', progress.job);
          
          // Additional check: Make sure to set the aptitude test correctly
          // Sometimes the aptitude test ID might be missing, try to find it
          if (progress.job.interviewRounds && progress.currentRound) {
            console.log('Searching for current round in interview rounds...');
            
            const currentRound = progress.job.interviewRounds.find(
              round => String(round._id) === String(progress.currentRound)
            );
            
            console.log('Current round found in job data:', currentRound);
            
            // If there's no aptitude test ID but this is an aptitude round, try to find it
            if (currentRound && currentRound.type === 'aptitude' && !currentRound.aptitudeTest) {
              console.log('Aptitude round found but missing aptitudeTest ID, attempting to fetch...');
              
              try {
                // Try to fetch the aptitude test for this round and job
                const testRes = await axios.get(
                  `${PIPELINE_API_END_POINT}/job/${jobId}/round/${currentRound._id}/aptitude-test`,
                  {
                    withCredentials: true,
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  }
                );
                
                if (testRes.data.success && testRes.data.aptitudeTest) {
                  console.log('Aptitude test found:', testRes.data.aptitudeTest);
                  
                  // Update the round with the correct aptitudeTest ID
                  const updatedRounds = progress.job.interviewRounds.map(r => {
                    if (String(r._id) === String(currentRound._id)) {
                      return { ...r, aptitudeTest: testRes.data.aptitudeTest._id };
                    }
                    return r;
                  });
                  
                  // Update the job data with the correct aptitudeTest ID
                  setJob(prev => ({
                    ...prev,
                    interviewRounds: updatedRounds
                  }));
                }
              } catch (error) {
                console.error('Error fetching aptitude test:', error);
              }
            }
          }
        } else {
          toast.error('Job data not found in application');
          console.error('progress.job is missing. Raw progress:', progress);
        }
      } else {
        toast.error('Failed to fetch progress');
      }
    } catch (error) {
      console.error('Error fetching job progress:', error);
      toast.error('Error fetching progress data');
    } finally {
      setLoading(false);
    }
  };

  // Fix: getRoundStatus should handle empty/undefined roundsStatus and object round IDs
  const getRoundStatus = (roundId) => {
    if (!progress || !progress.roundsStatus || !Array.isArray(progress.roundsStatus)) {
      return undefined;
    }
    
    return progress.roundsStatus.find((rs) => {
      // Handle case where rs.round might be an object with id or _id property
      let rsRoundId;
      if (typeof rs.round === 'object') {
        rsRoundId = rs.round._id || rs.round.id;
      } else {
        rsRoundId = rs.round;
      }
      
      // Handle case where roundId might be an object with id or _id property
      let compareId;
      if (typeof roundId === 'object') {
        compareId = roundId._id || roundId.id;
      } else {
        compareId = roundId;
      }
      
      return String(rsRoundId) === String(compareId);
    });
  };

  // Fix: shouldShowAptitudeButton logic, ensure it only checks for correct round
  const shouldShowAptitudeButton = (round) => {
    // If the round doesn't exist, don't show the button
    if (!round || !round._id) return false;
    
    // Handle the case where currentRound is an object with properties
    let currentRoundId;
    
    if (typeof progress?.currentRound === 'object') {
      // Use either _id or id, whichever is available
      currentRoundId = progress.currentRound._id || progress.currentRound.id;
    } else {
      // It's already a string or primitive
      currentRoundId = progress?.currentRound;
    }
    
    // Check if this is the current round
    const isCurrentRound = currentRoundId && String(round._id) === String(currentRoundId);
    
    // Check if this is an aptitude round
    const isAptitudeRound = round.type === 'aptitude';
    
    // Check if user has already taken this test
    const hasGivenTest = progress?.roundsStatus?.find(
      rs => String(rs.round) === String(round._id) && 
           ['passed', 'failed', 'awaiting_review'].includes(rs.status)
    );
    
    // Extended check for aptitude test ID - be more permissive
    // We'll show the button even if just one of these identifiers exists
    const hasAptitudeTestId = !!round.aptitudeTest;
    const hasAptitudeTestLink = !!(round.aptitudeTestLink && round.aptitudeTestLink.startsWith('internal:'));
    const hasExternalTestUrl = !!round.externalTestUrl;
    
    // Combined check - we have at least one valid test reference
    const hasAptitudeTest = hasAptitudeTestId || hasAptitudeTestLink || hasExternalTestUrl;

    // Log debug info for troubleshooting
    console.log('[Aptitude Button Debug]', {
      roundId: round._id,
      roundName: round.name,
      isCurrentRound,
      isAptitudeRound,
      hasGivenTest: !!hasGivenTest,
      hasAptitudeTest,
      aptitudeTestId: round.aptitudeTest,
      aptitudeTestLink: round.aptitudeTestLink,
      externalTestUrl: round.externalTestUrl,
      currentRoundId: currentRoundId
    });

    // For aptitude rounds, be more lenient - if it's the current round and it's an aptitude type,
    // show the button even if we don't have the test ID yet
    if (isCurrentRound && isAptitudeRound && !hasGivenTest) {
      // Even if we don't have the test ID, we'll still show the button and try to fetch the test
      // when the user clicks it
      return true;
    }
    
    // Standard check - must be current round, aptitude type, not taken yet, and have test ID
    return isCurrentRound && isAptitudeRound && !hasGivenTest && hasAptitudeTest;
  };

  // Improved function to ensure correct test navigation
  const handleStartAptitudeTest = async (round) => {
    try {
      // Debug information to track the flow
      console.log('[Test Start] Attempting to start aptitude test for round:', round);
      
      // Direct check - if we have the aptitudeTest ID, use it immediately
      if (round.aptitudeTest) {
        console.log('[Test Start] Using direct aptitudeTest ID:', round.aptitudeTest);
        navigateToAptitudeTest(round.aptitudeTest);
        return;
      }
      
      // Check if we have an internal test link
      if (round.aptitudeTestLink && round.aptitudeTestLink.startsWith('internal:')) {
        const testId = round.aptitudeTestLink.replace('internal:', '');
        console.log('[Test Start] Using aptitudeTestLink ID:', testId);
        navigateToAptitudeTest(testId);
        return;
      }
      
      // If external URL, open in new tab
      if (round.externalTestUrl) {
        console.log('[Test Start] Opening external test URL:', round.externalTestUrl);
        window.open(round.externalTestUrl, '_blank');
        return;
      }
      
      // If we don't have a direct reference to the test, try to fetch it
      console.log('[Test Start] No direct test reference found, attempting to fetch test for round:', round._id);
      
      // Fallback approach - try to fetch the aptitude test by round ID
      try {
        console.log('[Test Start] Trying to get pending tests from pipeline API');
        const pendingTestsResponse = await axios.get(`${PIPELINE_API_END_POINT}/pending-aptitude-tests`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (pendingTestsResponse.data.success && pendingTestsResponse.data.pendingTests) {
          const pendingTests = pendingTestsResponse.data.pendingTests;
          console.log('[Test Start] Pending tests:', pendingTests);
          
          // Try to find a test for this round
          const test = pendingTests.find(test => {
            return String(test.roundId) === String(round._id) || 
                   String(test.testId) === String(round.aptitudeTest);
          });
          
          if (test) {
            console.log('[Test Start] Found matching test:', test);
            navigateToAptitudeTest(test.testId);
            return;
          }
        } else {
          console.log('[Test Start] No pending tests found in response:', pendingTestsResponse.data);
        }
      } catch (pendingError) {
        console.error('[Test Start] Error fetching pending tests:', pendingError);
      }
      
      // Last resort - try to fetch the aptitude test specifically for this round
      try {
        if (!jobId || !round._id) {
          console.error('[Test Start] Missing jobId or roundId');
          throw new Error('Missing job ID or round ID');
        }
        
        console.log(`[Test Start] Attempting to fetch test directly using job=${jobId} and round=${round._id}`);
        const response = await axios.get(`${PIPELINE_API_END_POINT}/job/${jobId}/round/${round._id}/aptitude-test`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success && response.data.aptitudeTest) {
          console.log('[Test Start] Found test via direct fetch:', response.data.aptitudeTest);
          navigateToAptitudeTest(response.data.aptitudeTest._id);
          return;
        } else {
          console.log('[Test Start] No test found in response:', response.data);
        }
      } catch (error) {
        console.error('[Test Start] Failed to fetch test for round:', error);
      }
      
      // If we've reached this point, we couldn't find the test
      toast.error('Aptitude test not found or no longer available. Please contact the recruiter.');
      
    } catch (error) {
      console.error('[Test Start] Error starting aptitude test:', error);
      toast.error('Failed to start aptitude test. Please try again later.');
    }
  };

  // Helper function to correctly navigate to aptitude test
  const navigateToAptitudeTest = (testId) => {
    if (!testId) {
      console.error('[Navigate Test] Invalid test ID:', testId);
      toast.error('Invalid test ID. Please contact the recruiter.');
      return;
    }
    
    // Make sure we remove any whitespace or unwanted characters
    const cleanTestId = String(testId).trim();
    
    // Use a consistent format for the aptitude test URL
    const aptitudeTestUrl = `/candidate/aptitude-test/${cleanTestId}`;
    
    console.log(`[Navigate Test] Navigating to: ${aptitudeTestUrl}`);
    
    // Use the navigate function from react-router-dom
    navigate(aptitudeTestUrl);
  };

  // Add a function to force a test for the current round
  const forceAptitudeTest = () => {
    if (!progress?.currentRound) {
      toast.error('No current round found');
      return;
    }
    
    // Handle the case where currentRound is an object with properties
    let currentRoundId;
    
    if (typeof progress.currentRound === 'object') {
      // Use either _id or id, whichever is available
      currentRoundId = progress.currentRound._id || progress.currentRound.id;
      console.log('Current round is an object with ID:', currentRoundId);
    } else {
      // It's already a string or primitive
      currentRoundId = progress.currentRound;
      console.log('Current round is a primitive:', currentRoundId);
    }
    
    // Find the round in the rounds array
    const currentRound = rounds.find(r => String(r._id) === String(currentRoundId));
    
    if (!currentRound) {
      toast.error('Current round not found in rounds list');
      return;
    }
    
    // If the currentRound is an object with type info, use that; otherwise use the one from rounds array
    const roundType = typeof progress.currentRound === 'object' && progress.currentRound.type
      ? progress.currentRound.type
      : currentRound.type;
    
    if (roundType !== 'aptitude') {
      toast.error('Current round is not an aptitude round');
      console.log('Round type:', roundType);
      return;
    }
    
    // Create a mock round with test data for debugging
    const testRound = {
      ...currentRound,
      aptitudeTest: currentRound.aptitudeTest || 'temp-test-id',
    };
    
    console.log('Forcing aptitude test for round:', testRound);
    handleStartAptitudeTest(testRound);
  };

  const getStatusBadge = (status) => {
    // Ensure status is a string
    const safeStatus = typeof status === 'string' ? status : safeToString(status);
    
    switch (safeStatus?.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">Pending</Badge>;
      case 'passed':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Passed</Badge>;
      case 'failed':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100">Failed</Badge>;
      case 'in_process':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">In Progress</Badge>;
      case 'hired':
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">Hired</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">{safeStatus || 'Unknown'}</Badge>;
    }
  };

  // Also add a utility function to safely convert any value to a display string
  const safeToString = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(value);
  };

  // Enhanced round card with timeline visualization
  const renderRoundCard = (round, index, totalRounds) => {
    const roundStatus = getRoundStatus(round._id);
    
    // Handle the case where currentRound is an object with properties
    let currentRoundId;
    
    if (typeof progress?.currentRound === 'object') {
      currentRoundId = progress.currentRound._id || progress.currentRound.id;
    } else {
      currentRoundId = progress?.currentRound;
    }

    // Check if all rounds are passed
    const allRoundsPassed = rounds.every(r => {
      const status = getRoundStatus(r._id);
      return status && status.status === 'passed';
    });
    
    const isCurrentRound = !allRoundsPassed && currentRoundId && String(round._id) === String(currentRoundId);
    const isPastRound = roundStatus && ["passed", "failed"].includes(roundStatus.status);
    const isFutureRound = !isCurrentRound && !isPastRound;
    const isAptitudeRound = round.type === 'aptitude';
    
    // Check if this is the current round and it's an aptitude round
    const showAptitudeButton = shouldShowAptitudeButton(round);
    
    // Determine icon based on status and type
    const getStatusIcon = () => {
      if (!roundStatus) return <Circle className="h-8 w-8 text-gray-300" />;
      
      switch(roundStatus.status) {
        case 'passed':
          return <CheckCircle2 className="h-8 w-8 text-emerald-500" />;
        case 'failed':
          return <XCircle className="h-8 w-8 text-rose-500" />;
        case 'scheduled':
          return <Calendar className="h-8 w-8 text-blue-500" />;
        case 'pending':
          if (isCurrentRound) return <AlertCircle className="h-8 w-8 text-amber-500" />; 
          return <Clock className="h-8 w-8 text-gray-400" />;
        default:
          return <Circle className="h-8 w-8 text-gray-300" />;
      }
    };
    
    // Get the round type icon
    const getRoundTypeIcon = () => {
      switch(round.type) {
        case 'aptitude':
          return <ScrollText className="h-5 w-5" />;
        case 'technical':
          return <Briefcase className="h-5 w-5" />;
        case 'hr':
          return <Building className="h-5 w-5" />;
        case 'final':
          return <Award className="h-5 w-5" />;
        default:
          return <Circle className="h-5 w-5" />;
      }
    };
    
    return (
      <div key={round._id || index} className="relative">
        {/* Timeline connector */}
        {index < totalRounds - 1 && (
          <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200 ml-3.5 z-0"></div>
        )}
        
        <div className={`mb-8 flex items-start gap-6 relative z-10 ${isCurrentRound ? 'opacity-100' : (isPastRound ? 'opacity-90' : 'opacity-60')}`}>
          {/* Timeline node */}
          <div className={`rounded-full p-1 ${
            isCurrentRound 
              ? 'bg-blue-100 ring-4 ring-blue-50' 
              : isPastRound 
                ? roundStatus?.status === 'passed' 
                  ? 'bg-emerald-100 ring-4 ring-emerald-50' 
                  : 'bg-rose-100 ring-4 ring-rose-50' 
                : 'bg-gray-100 ring-4 ring-gray-50'
          }`}>
            {getStatusIcon()}
          </div>
          
          <div className={`flex-1 transition-all duration-300 ${isCurrentRound && !allRoundsPassed ? 'transform scale-105' : ''}`}>
            <Card className={`overflow-hidden transition-all ${
              isCurrentRound && !allRoundsPassed
                ? 'border-blue-300 shadow-md shadow-blue-100' 
                : isPastRound
                  ? roundStatus?.status === 'passed'
                    ? 'border-emerald-200'
                    : 'border-rose-200'
                  : 'border-gray-200 hover:border-gray-300'
            } ${isCurrentRound && !allRoundsPassed ? 'bg-white' : isPastRound ? 'bg-gray-50' : 'bg-gray-50/50'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${
                      isCurrentRound && !allRoundsPassed ? 'bg-blue-100 text-blue-700' : 
                      isPastRound ? (roundStatus?.status === 'passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700') : 
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getRoundTypeIcon()}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {typeof round.name === 'string' ? round.name : `Round ${index + 1}`}
                      </CardTitle>
                      <CardDescription>
                        {typeof round.description === 'string' ? round.description : `${safeToString(round.type)} round`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    {roundStatus && getStatusBadge(roundStatus.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {roundStatus && roundStatus.scheduledDateTime && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <CalendarDays className="h-4 w-4" />
                    <span>Scheduled for {new Date(roundStatus.scheduledDateTime).toLocaleString()}</span>
                  </div>
                )}
                
                {/* Only show score for aptitude rounds */}
                {isAptitudeRound && roundStatus && roundStatus.score !== undefined && roundStatus.score !== null && (
                  <div className="mb-3">
                    <div className="text-sm font-medium mb-1">Score</div>
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-sm font-medium">
                        {roundStatus.score}%
                      </div>
                      <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{width: `${Math.min(100, Math.max(0, roundStatus.score))}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {(roundStatus && roundStatus.feedback) && (
                  <div className="mb-3">
                    <div className="text-sm font-medium mb-1">Feedback</div>
                    <div className="text-sm bg-gray-50 p-2 rounded border border-gray-100">
                      {roundStatus.feedback}
                    </div>
                  </div>
                )}
                
                {/* Show aptitude test button */}
                {showAptitudeButton && (
                  <div className="mt-4">
                    <Button
                      onClick={() => handleStartAptitudeTest(round)}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    >
                      Take Aptitude Test
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <Navbar />
        <div className="container max-w-5xl mx-auto py-12 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!job || !progress) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <Navbar />
        <div className="container max-w-5xl mx-auto py-12 px-4">
          <Card className="border-none shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl text-gray-700">Interview Progress</CardTitle>
              <CardDescription className="text-gray-500">
                No progress data found for this job.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-4">
              <img 
                src="https://illustrations.popsy.co/amber/looking-for-a-job.svg" 
                alt="No data" 
                className="w-64 h-64 opacity-80"
              />
            </CardContent>
            <CardFooter className="flex justify-center pt-0">
              <Button onClick={() => navigate('/candidate/dashboard')} className="px-6">
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Group rounds by status for the summary
  const completedRounds = rounds.filter(round => {
    const status = getRoundStatus(round._id);
    return status && status.status === 'passed';
  }).length;
  
  const failedRounds = rounds.filter(round => {
    const status = getRoundStatus(round._id);
    return status && status.status === 'failed';
  }).length;
  
  const pendingRounds = rounds.length - completedRounds - failedRounds;
  const progressPercentage = rounds.length > 0 ? Math.round((completedRounds / rounds.length) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <Navbar />
      <div className="container max-w-5xl mx-auto py-12 px-4">
        <Button
          variant="outline"
          onClick={() => navigate('/candidate/dashboard')}
          className="mb-6 flex items-center gap-2 border-gray-300 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <Card className="border-none shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{job?.title ? safeToString(job.title) : 'Interview Process'}</h2>
                  <p className="text-blue-100 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {job?.company?.name ? safeToString(job.company.name) : 'Company'}
                  </p>
                </div>
                <div>
                  {progress?.overallStatus && getStatusBadge(safeToString(progress.overallStatus))}
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-4">
                <div className="col-span-3">
                  <h3 className="text-lg font-semibold mb-2">Your Progress</h3>
                  <div className="bg-gray-100 h-2.5 rounded-full mb-2 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                      style={{width: `${progressPercentage}%`}}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 flex justify-between">
                    <span>Application Submitted</span>
                    <span className="font-medium">{progressPercentage}% Complete</span>
                    <span>Final Decision</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
                  <div className="bg-emerald-50 rounded-lg p-3 flex items-center gap-3">
                    <div className="bg-emerald-100 rounded-full p-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600">Completed</p>
                      <p className="text-lg font-semibold text-emerald-800">{completedRounds}</p>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 rounded-lg p-3 flex items-center gap-3">
                    <div className="bg-amber-100 rounded-full p-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-amber-600">Pending</p>
                      <p className="text-lg font-semibold text-amber-800">{pendingRounds}</p>
                    </div>
                  </div>
                  
                  <div className="bg-rose-50 rounded-lg p-3 flex items-center gap-3">
                    <div className="bg-rose-100 rounded-full p-2">
                      <XCircle className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-xs text-rose-600">Failed</p>
                      <p className="text-lg font-semibold text-rose-800">{failedRounds}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <h3 className="text-xl font-bold mb-6 text-gray-800">Interview Rounds</h3>
        
        <div className="space-y-2">
          {rounds.map((round, index) => renderRoundCard(round, index, rounds.length))}
        </div>
        
        {progress?.nextInterviewDate && (
          <Card className="mt-8 border-blue-200 bg-blue-50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-white rounded-full p-3 shadow-sm">
                <CalendarDays className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-800">Upcoming Interview</h3>
                <p className="text-blue-600">
                  Scheduled for {new Date(progress.nextInterviewDate).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {progress?.overallStatus === 'hired' && (
          <Card className="mt-8 border-purple-200 bg-purple-50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-white rounded-full p-3 shadow-sm">
                <Award className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-purple-800">Congratulations!</h3>
                <p className="text-purple-600">
                  You've been hired for this position. The company will contact you soon with next steps.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InterviewProgress;