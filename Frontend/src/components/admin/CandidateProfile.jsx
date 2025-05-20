import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../shared/Navbar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  FileText,
  User,
  Star,
  Award,
  ExternalLink,
  Download,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useSelector } from 'react-redux';
import useGetCandidateById from '@/hooks/useGetCandidateById';
import { 
  APPLICATION_API_END_POINT, 
  PIPELINE_API_END_POINT, 
  JOB_API_END_POINT,
  USER_API_END_POINT
} from '@/utils/constant';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "../ui/dialog";
import { Textarea } from '../ui/textarea';

// Import company logo
import companyLogo2 from '../../assets/images/logo2.png';

// Status badge colors
const StatusColors = {
  pending: "bg-gray-100 text-gray-800 border-gray-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  awaiting_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  passed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  hired: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  applied: "bg-purple-100 text-purple-800 border-purple-200",
  in_process: "bg-blue-100 text-blue-800 border-blue-200",
  accepted: "bg-green-100 text-green-800 border-green-200"
};

// Status label mapping
const StatusLabels = {
  pending: "Pending",
  in_progress: "In Progress",
  awaiting_review: "Awaiting Review",
  passed: "Passed",
  failed: "Failed",
  hired: "Hired",
  rejected: "Rejected",
  applied: "Applied",
  in_process: "In Process",
  accepted: "Accepted"
};

const CandidateProfile = () => {
  const { candidateId, jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { loading: candidateLoading, candidate, error: candidateError, refetch } = useGetCandidateById(candidateId);
  
  // Pipeline state
  const [jobData, setJobData] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [candidateProgress, setCandidateProgress] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Legacy state - keep for backward compatibility
  const [isOpen, setIsOpen] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('');
  const [applicationNote, setApplicationNote] = useState('');

  const handleDownloadResume = () => {
    if (candidate?.profile?.resume) {
      window.open(candidate.profile.resume, '_blank');
    } else {
      toast.error('No resume available for download');
    }
  };

  const handleSendEmail = () => {
    if (candidate?.email) {
      window.open(`mailto:${candidate.email}?subject=Regarding your job application`, '_blank');
    } else {
      toast.error('No email address available');
    }
  };

  useEffect(() => {
    if (candidateId && jobId) {
      fetchCandidateApplications();
      fetchJobAndPipelineData();
    }
  }, [candidateId, jobId]);

  const fetchCandidateApplications = async () => {
    try {
      console.log(`Fetching applications for candidate: ${candidateId}`);
      
      // Use the my-applications endpoint with a query parameter for the candidate ID
      const res = await axios.get(`${APPLICATION_API_END_POINT}/my-applications`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          candidateId: candidateId
        }
      });

      if (res.data.success) {
        setApplications(res.data.applications || []);
        
        // Find application for current job
        if (jobId) {
          const currentJobApp = res.data.applications.find(app => app.job?._id === jobId);
          if (currentJobApp) {
            setSelectedApplication(currentJobApp);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      
      // Check for specific error types
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server responded with error:', error.response.status, error.response.data);
        
        if (error.response.status === 403) {
          toast.error('Permission denied: You do not have access to view this candidate\'s applications');
        } else {
          toast.error(`Failed to load candidate applications: ${error.response.data.message || 'Server error'}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from server');
        toast.error('Network error: Could not connect to the server');
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error('Failed to load candidate applications');
      }
      
      // If we have jobId, try to get at least the current application
      if (jobId) {
        try {
          const checkRes = await axios.get(`${APPLICATION_API_END_POINT}/check/${jobId}`, {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (checkRes.data.success && checkRes.data.hasApplied) {
            setSelectedApplication(checkRes.data.application);
          }
        } catch (checkError) {
          console.error('Error checking application:', checkError);
        }
      }
    }
  };

  const fetchJobAndPipelineData = async () => {
    if (!jobId) return;
    
    try {
      setPipelineLoading(true);
      
      // Fetch job details
      const jobRes = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (jobRes.data.success) {
        setJobData(jobRes.data.job);
        
        // Extract interview rounds
        if (jobRes.data.job.interviewRounds?.length > 0) {
          setRounds(jobRes.data.job.interviewRounds);
        }
      }
      
      // Fetch candidate progress
      const progressRes = await axios.get(
        `${PIPELINE_API_END_POINT}/job/${jobId}/candidate/${candidateId}/progress`,
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (progressRes.data.success) {
        setCandidateProgress(progressRes.data.progress);
      }
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
      toast.error('Failed to load interview pipeline data');
    } finally {
      setPipelineLoading(false);
    }
  };

  const confirmAction = (actionType, roundId = null) => {
    setSelectedRound(roundId);
    setPendingAction(actionType);
    setFeedback(actionType === 'pass' 
      ? 'Candidate has successfully passed this round.' 
      : 'Candidate did not meet the requirements for this round.');
    setActionDialogOpen(true);
  };

  const executePendingAction = async () => {
    if (!pendingAction) return;

    try {
      setProcessingAction(true);
      let result;
      
      switch (pendingAction) {
        case 'accept':
        case 'reject':
          result = await finalizeCandidate(pendingAction);
          break;
        case 'pass':
        case 'fail':
          if (!selectedRound) throw new Error('No round selected');
          result = await evaluateCandidate(
            selectedRound, 
            pendingAction === 'pass' ? 'passed' : 'failed',
            null
          );
          break;
        case 'initial-accept':
          result = await handleInitialAccept();
          break;
        case 'initial-reject':
          result = await handleInitialReject();
          break;
        default:
          throw new Error('Invalid action');
      }

      if (result?.success) {
        toast.success(`Action completed successfully`);
        // Refresh data
        await fetchJobAndPipelineData();
        await fetchCandidateApplications();
      }
    } catch (error) {
      console.error('Error executing action:', error);
      toast.error(error.message || 'Failed to complete action');
    } finally {
      setActionDialogOpen(false);
      setPendingAction(null);
      setSelectedRound(null);
      setFeedback('');
      setProcessingAction(false);
    }
  };

  const evaluateCandidate = async (roundId, status, score = null) => {
    try {
      // Ensure feedback is not empty
      const feedbackText = feedback.trim() || (status === 'passed' 
        ? 'Candidate passed this round' 
        : 'Candidate did not meet requirements');
      
      const payload = {
        roundId,
        status,
        feedback: feedbackText,
        ...(score !== null && { score })
      };
  
      console.log(`Evaluating candidate ${candidateId} for round ${roundId} with status: ${status}`);
      console.log('Sending feedback:', feedbackText);
      
      const res = await axios.put(
        `${PIPELINE_API_END_POINT}/job/${jobId}/candidate/${candidateId}`,
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
        // Get the round name for better feedback
        const currentRoundObj = rounds.find(r => r._id === roundId);
        const roundName = currentRoundObj ? currentRoundObj.name : 'this round';
        
        // Send email notification to candidate only if they have enabled email notifications
        if (candidate.notificationPreferences?.emailNotifications) {
          try {
            const nextRound = status === 'passed' ? 
              rounds.find(r => r.order === (currentRoundObj?.order || 0) + 1) : null;
            
            const nextStepsMessage = status === 'passed' && nextRound
              ? `Your next step is the ${nextRound.name} round. We will be in touch soon with specific details about the schedule and preparation requirements.`
              : status === 'passed'
                ? 'You have successfully completed all interview rounds. Our hiring team is now reviewing your overall performance and will make a final decision shortly.'
                : 'We appreciate your interest in our company and the time you invested in the application process. We encourage you to apply for future positions that match your qualifications.';
            
            const emailRes = await axios.post(
              `${USER_API_END_POINT}/send-email`,
              {
                to: candidate.email,
                subject: `${status === 'passed' ? 'Congratulations' : 'Update'} - ${jobData?.title || 'Job'} Application - ${roundName} ${status === 'passed' ? 'Passed' : 'Result'}`,
                template: status === 'passed' ? 'acceptance' : 'update',
                data: {
                  candidateName: candidate.fullname,
                  message: status === 'passed'
                    ? `We're pleased to inform you that you have successfully passed the ${roundName} round of your application.`
                    : `We regret to inform you that you did not meet our requirements for the ${roundName} round of your application.`,
                  nextSteps: nextStepsMessage,
                  feedback: feedbackText,
                  companyName: jobData?.company?.name || 'Our Company',
                  position: jobData?.title || 'the position',
                  roundName: roundName,
                  companyAddress: jobData?.company?.location || jobData?.location || 'Remote / To be determined',
                  contactEmail: jobData?.company?.email || 'contact@hirewave.com',
                  companyLogoUrl: jobData?.company?.logo || '',
                  termsAndConditions: status === 'passed' ? [
                    'Please check your dashboard regularly for updates on your application status.',
                    'Prepare thoroughly for your next interview round using the resources provided.',
                    'Ensure your contact information is up-to-date in your profile.',
                    'Respond promptly to any additional requests for information.',
                    'Contact our recruitment team if you have any questions about the process.'
                  ] : []
                }
              },
              {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );

            if (emailRes.data.skipped) {
              console.log('Email notification skipped - candidate has disabled email notifications');
            } else {
              console.log('Email notification sent successfully');
            }
          } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
          }
        } else {
          console.log('Email notifications disabled for candidate:', candidate.email);
        }

        // Get updated application data
        const updatedAppResponse = await axios.get(
          `${APPLICATION_API_END_POINT}/progress/application/${selectedApplication._id}`,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (status === 'passed') {
          toast.success(`Candidate has passed ${roundName} and moved to the next stage.`);
        } else {
          toast.info(`Candidate has been marked as failed for ${roundName}.`);
        }
        return res.data;
      } else {
        throw new Error(res.data.message || 'Evaluation failed');
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      throw error;
    }
  };

  const finalizeCandidate = async (status) => {
    try {
      const res = await axios.put(
        `${PIPELINE_API_END_POINT}/job/${jobId}/candidate/${candidateId}/finalize`,
        {
          status: status === 'accept' ? 'hired' : 'rejected'
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (res.data.success) {
        // Send email notification to candidate only if they have enabled email notifications
        if (candidate.notificationPreferences?.emailNotifications) {
          try {
            const isHired = status === 'accept';
            const feedbackText = feedback.trim() || (isHired 
              ? 'Congratulations on your successful application. We were impressed with your skills and experience.' 
              : 'Thank you for your interest in our company. While your qualifications are impressive, we have decided to pursue other candidates at this time.');

            const nextStepsMessage = isHired
              ? 'Our HR team will contact you within the next 48 hours with details about your onboarding process, start date, and required documentation. Please ensure your contact information is up-to-date in your profile.'
              : 'Thank you for your interest in our company and the time you invested in the application process. While we cannot move forward with your candidacy at this time, we encourage you to apply for future positions that match your qualifications.';

            const emailRes = await axios.post(
              `${USER_API_END_POINT}/send-email`,
              {
                to: candidate.email,
                subject: isHired 
                  ? `Congratulations! Job Offer for ${jobData?.title || 'Position'} at ${jobData?.company?.name || 'Our Company'}` 
                  : `Update on Your Application for ${jobData?.title || 'Position'} at ${jobData?.company?.name || 'Our Company'}`,
                template: isHired ? 'hired' : 'update',
                data: {
                  candidateName: candidate.fullname,
                  message: isHired
                    ? `We are delighted to inform you that you have been selected for the ${jobData?.title || 'position'} at ${jobData?.company?.name || 'our company'}. After careful consideration of your qualifications, experience, and performance throughout the interview process, we believe you would be an excellent addition to our team.`
                    : `After careful consideration of your application for the ${jobData?.title || 'position'} at ${jobData?.company?.name || 'our company'}, we regret to inform you that we will not be moving forward with your candidacy at this time.`,
                  nextSteps: nextStepsMessage,
                  feedback: feedbackText,
                  companyName: jobData?.company?.name || 'Our Company',
                  position: jobData?.title || 'the position',
                  companyAddress: jobData?.company?.location || jobData?.location || 'Remote / To be determined',
                  contactEmail: jobData?.company?.email || 'contact@hirewave.com',
                  companyLogoUrl: jobData?.company?.logo || '',
                  termsAndConditions: isHired ? [
                    'Please respond to this offer within 5 business days.',
                    'All employment is contingent upon successful completion of background checks.',
                    'Please keep this offer confidential.',
                    'Prepare necessary identification and tax documents for onboarding.',
                    'Contact our HR team if you have any questions about the offer or onboarding process.'
                  ] : []
                }
              },
              {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );

            if (emailRes.data.skipped) {
              console.log('Email notification skipped - candidate has disabled email notifications');
            } else {
              console.log('Final decision email notification sent successfully');
            }
          } catch (emailError) {
            console.error('Failed to send final decision email notification:', emailError);
          }
        } else {
          console.log('Email notifications disabled for candidate:', candidate.email);
        }

        if (status === 'accept') {
          toast.success('Candidate hired successfully!');
        } else {
          toast.success('Candidate rejected successfully!');
        }
        return res.data;
      } else {
        throw new Error(res.data.message || `Failed to ${status === 'accept' ? 'hire' : 'reject'} candidate`);
      }
    } catch (error) {
      console.error('Error finalizing candidate:', error);
      throw error;
    }
  };

  const handleInitialAccept = async () => {
    try {
      if (!selectedApplication) {
        throw new Error("No application selected");
      }

      // Update application status
      const response = await axios.post(
        `${APPLICATION_API_END_POINT}/status/${selectedApplication._id}/update`,
        { status: 'accepted' },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Add candidate to pipeline
        const pipelineResponse = await axios.post(
          `${PIPELINE_API_END_POINT}/job/${jobId}/candidate/${candidateId}`,
          {
            status: 'in_process',
            applicationId: selectedApplication._id
          },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (pipelineResponse.data.success) {
          // Send enhanced email notification to candidate
          try {
            // Find the first round in the interview process
            const firstRound = rounds.length > 0 ? rounds.sort((a, b) => a.order - b.order)[0] : null;
            
            // Get company logo and profile picture
            const companyLogo = jobData?.company?.logo && jobData.company.logo.trim() !== '' 
              ? jobData.company.logo 
              : '';
              
            // Get company profile picture (from company user if available)
            let companyProfilePic = '';
            if (jobData?.company?.userId) {
              try {
                // Try to fetch the company user's profile picture
                const companyUserResponse = await axios.get(
                  `${USER_API_END_POINT}/candidate/${jobData.company.userId}`,
                  {
                    withCredentials: true,
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  }
                );
                
                if (companyUserResponse.data.success && companyUserResponse.data.user?.profile?.profilePhoto) {
                  companyProfilePic = companyUserResponse.data.user.profile.profilePhoto;
                  console.log('Found company profile picture:', companyProfilePic);
                }
              } catch (error) {
                console.error('Failed to fetch company user profile picture:', error);
              }
            }
            
            // Use the imported logo2.png as the company's profile picture
            companyProfilePic = companyProfilePic || companyLogo2;
            
            // Website picture location will be left blank for you to update later
            const websitePicture = '';
            
            // Create a more structured email with better styling
            await axios.post(
              `${USER_API_END_POINT}/send-email`,
              {
                to: candidate.email,
                subject: `Application Accepted - ${jobData?.title || 'Job'} at ${jobData?.company?.name || 'Our Company'}`,
                template: 'acceptance',
                data: {
                  candidateName: candidate.fullname,
                  message: `We're pleased to inform you that your application for the ${jobData?.title || 'position'} has been accepted for further consideration. Your qualifications and experience have impressed our initial screening team.`,
                  nextSteps: firstRound 
                    ? `Your next step is the ${firstRound.name} round. ${firstRound.type === 'aptitude' 
                        ? 'You will need to complete an aptitude test. Please check your dashboard for more details.'
                        : firstRound.type === 'technical' 
                          ? 'You will have a technical interview. Our team will contact you with more details soon.'
                          : firstRound.type === 'hr' 
                            ? 'You will have an HR interview. Our team will contact you with more details soon.'
                            : 'Please check your dashboard for more details about the next steps.'}` 
                    : 'Our recruitment team will review your application in detail and contact you shortly regarding the next steps in the process. Please monitor your email and phone for updates.',
                  companyName: jobData?.company?.name || 'HireWave',
                  position: jobData?.title || 'the position',
                  companyAddress: jobData?.company?.location || jobData?.location || 'Remote',
                  contactEmail: jobData?.company?.email || 'contact@hirewave.com',
                  companyLogo: companyLogo,
                  companyProfilePic: companyProfilePic,
                  websitePicture: websitePicture,
                  emailTitle: `Application Accepted - ${jobData?.title || 'Position'}`,
                  headerColor: '#4CAF50',
                  headerBackground: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                  footerLinks: [
                    { text: 'Visit Dashboard', url: 'https://hirewave.com/dashboard' },
                    { text: 'Contact Support', url: 'mailto:support@hirewave.com' }
                  ],
                  socialLinks: [
                    { platform: 'facebook', url: 'https://facebook.com/hirewave' },
                    { platform: 'twitter', url: 'https://twitter.com/hirewave' },
                    { platform: 'linkedin', url: 'https://linkedin.com/company/hirewave' }
                  ],
                  termsAndConditions: [
                    'Please ensure your contact information is up-to-date in your profile.',
                    'Prepare your resume and portfolio for potential review in upcoming rounds.',
                    'Research our company and the position to prepare for potential interviews.',
                    'Respond promptly to any additional requests for information.',
                    'Contact our recruitment team if you have any questions about the process.'
                  ]
                }
              },
              {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            
            console.log('Acceptance email sent successfully to:', candidate.email);
            toast.success('Application accepted and notification email sent');
            // Refresh data to update UI
            await fetchJobAndPipelineData();
            return response.data;
          } catch (emailError) {
            console.error('Failed to send acceptance email:', emailError);
            toast.warning('Application accepted but failed to send email notification');
            // Even if email fails, we should still refresh the data
            await fetchJobAndPipelineData();
            return response.data;
          }
        } else {
          throw new Error(pipelineResponse.data.message || 'Failed to add candidate to pipeline');
        }
      } else {
        throw new Error(response.data.message || 'Failed to update application status');
      }
    } catch (error) {
      console.error('Error accepting candidate:', error);
      toast.error(error.message || 'Failed to accept application');
      throw error;
    }
  };

  const handleInitialReject = async () => {
    try {
      if (!selectedApplication) {
        throw new Error("No application selected");
      }

      // Update application status
      const response = await axios.post(
        `${APPLICATION_API_END_POINT}/status/${selectedApplication._id}/update`,
        { status: 'rejected' },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Send email notification to candidate
        try {
          // Get company logo and profile picture
          const companyLogo = jobData?.company?.logo && jobData.company.logo.trim() !== '' 
            ? jobData.company.logo 
            : '';
            
          // Get company profile picture (from company user if available)
          let companyProfilePic = '';
          if (jobData?.company?.userId) {
            try {
              // Try to fetch the company user's profile picture
              const companyUserResponse = await axios.get(
                `${USER_API_END_POINT}/candidate/${jobData.company.userId}`,
                {
                  withCredentials: true,
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              
              if (companyUserResponse.data.success && companyUserResponse.data.user?.profile?.profilePhoto) {
                companyProfilePic = companyUserResponse.data.user.profile.profilePhoto;
                console.log('Found company profile picture for rejection email:', companyProfilePic);
              }
            } catch (error) {
              console.error('Failed to fetch company user profile picture for rejection email:', error);
            }
          }
          
          // Use the imported logo2.png as the company's profile picture
          companyProfilePic = companyProfilePic || companyLogo2;
          
          // Website picture location will be left blank for you to update later
          const websitePicture = '';
            
          await axios.post(
            `${USER_API_END_POINT}/send-email`,
            {
              to: candidate.email,
              subject: `Application Update - ${jobData?.title || 'Job'} at ${jobData?.company?.name || 'Our Company'}`,
              template: 'update',
              data: {
                candidateName: candidate.fullname,
                message: `After careful review of your application for the ${jobData?.title || 'position'}, we regret to inform you that we will not be moving forward with your candidacy at this time. While your qualifications are impressive, we have decided to pursue other candidates whose experience more closely aligns with our current needs.`,
                nextSteps: `Thank you for your interest in our company. We encourage you to apply for future positions that match your qualifications and experience. We wish you the best in your job search and professional endeavors.`,
                companyName: jobData?.company?.name || 'HireWave',
                position: jobData?.title || 'the position',
                companyAddress: jobData?.company?.location || jobData?.location || 'Remote',
                contactEmail: jobData?.company?.email || 'contact@hirewave.com',
                companyLogo: companyLogo,
                companyProfilePic: companyProfilePic,
                websitePicture: websitePicture,
                emailTitle: `Application Status Update - ${jobData?.title || 'Position'}`,
                headerColor: '#607D8B',
                headerBackground: 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)',
                feedback: 'We appreciate your interest in our company and the time you invested in the application process.',
                footerLinks: [
                  { text: 'View Other Jobs', url: 'https://hirewave.com/jobs' },
                  { text: 'Contact Support', url: 'mailto:support@hirewave.com' }
                ],
                socialLinks: [
                  { platform: 'facebook', url: 'https://facebook.com/hirewave' },
                  { platform: 'twitter', url: 'https://twitter.com/hirewave' },
                  { platform: 'linkedin', url: 'https://linkedin.com/company/hirewave' }
                ],
                termsAndConditions: [
                  'This decision is not a reflection of your qualifications or abilities.',
                  'We keep all applications on file for future reference.',
                  'You are welcome to apply for other positions that match your skills and experience.',
                  'We wish you success in your job search and professional endeavors.'
                ]
              }
            },
            {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          console.log('Rejection email sent successfully to:', candidate.email);
          toast.success('Application rejected and notification email sent');
          // Refresh data to update UI
          await fetchJobAndPipelineData();
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
          toast.warning('Application rejected but failed to send email notification');
          // Even if email fails, we should still refresh the data
          await fetchJobAndPipelineData();
        }
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to reject application');
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error(error.message || 'Failed to reject application');
      throw error;
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getRoundStatus = (roundId) => {
    if (!candidateProgress || !candidateProgress.rounds) return null;
    
    return candidateProgress.rounds.find(r => r._id === roundId);
  };

  const isCurrentRound = (roundId) => {
    return candidateProgress?.currentRound === roundId;
  };

  const hasPassedRound = (roundId) => {
    const roundStatus = getRoundStatus(roundId);
    return roundStatus?.status === 'passed';
  };

  const hasFailedRound = (roundId) => {
    const roundStatus = getRoundStatus(roundId);
    return roundStatus?.status === 'failed';
  };

  const isPendingRound = (roundId) => {
    const roundStatus = getRoundStatus(roundId);
    return roundStatus?.status === 'pending' || !roundStatus?.status;
  };

  const renderPipelineStatus = () => {
    if (!selectedApplication) {
      return (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-blue-800">
          <p>No application found for this candidate and job.</p>
          <p className="mt-2">The candidate may not have applied for this position yet.</p>
        </div>
      );
    }

    if (selectedApplication.status === 'pending') {
      return (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-medium text-yellow-800 mb-2">Application Pending Review</h3>
          <p className="text-yellow-700 mb-4">
            This candidate has applied for this position but their application has not been reviewed yet.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => confirmAction('initial-accept')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Application
            </Button>
            <Button
              variant="outline"
              onClick={() => confirmAction('initial-reject')}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Application
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-white rounded-md border border-yellow-100">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Application Details</h4>
            <div className="text-sm text-yellow-700">
              <p><span className="font-medium">Applied on:</span> {formatDate(selectedApplication.createdAt)}</p>
              {selectedApplication.coverLetter && (
                <div className="mt-2">
                  <p className="font-medium">Cover Letter:</p>
                  <p className="mt-1 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (selectedApplication.status === 'rejected') {
      return (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="font-medium text-red-800 mb-2">Application Rejected</h3>
          <p className="text-red-700">
            This candidate's application has been rejected.
          </p>
          {selectedApplication.rejectionReason && (
            <div className="mt-3 p-3 bg-white rounded-md border border-red-100">
              <h4 className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</h4>
              <p className="text-sm text-red-700">{selectedApplication.rejectionReason}</p>
            </div>
          )}
        </div>
      );
    }

    if (!rounds || rounds.length === 0) {
      return (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800">
 No interview rounds have been configured for this job.
</div>
      );
    }

    if (!candidateProgress) {
      return (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-blue-800">
 This candidate has been accepted but is not yet in the interview pipeline.
<div className="mt-4 flex gap-2">
<Button
onClick={() => confirmAction('initial-accept')}
className="bg-green-600 hover:bg-green-700 text-white"
>
<CheckCircle className="h-4 w-4 mr-2" />
Add to Pipeline
</Button>
</div>
</div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-800">Interview Pipeline Progress</h3>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Overall Progress</span>
                <span className="text-sm font-medium text-gray-800">
                  {Math.round((candidateProgress.rounds.filter(r => r.status === 'passed').length / rounds.length) * 100)}%
                </span>
              </div>
              <Progress 
                value={(candidateProgress.rounds.filter(r => r.status === 'passed').length / rounds.length) * 100} 
                className="h-2 bg-gray-100"
              />
            </div>
            
            <div className="space-y-4">
              {rounds.map((round, index) => {
                const roundStatus = getRoundStatus(round._id);
                const isCurrent = isCurrentRound(round._id);
                const isPassed = hasPassedRound(round._id);
                const isFailed = hasFailedRound(round._id);
                const isPending = isPendingRound(round._id);
                
                return (
                  <div 
                    key={round._id} 
                    className={`p-4 rounded-lg border ${isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                          isPassed ? 'bg-green-500' : 
                          isFailed ? 'bg-red-500' : 
                          isCurrent ? 'bg-blue-500' : 
                          'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{round.name}</h4>
                          <p className="text-gray-700">{round.type}</p>
                        </div>
                      </div>
                      
                      <Badge className={`${
                        isPassed ? StatusColors.passed : 
                        isFailed ? StatusColors.failed : 
                        isCurrent ? StatusColors.in_progress : 
                        StatusColors.pending
                      }`}>
                        {isPassed ? StatusLabels.passed : 
                         isFailed ? StatusLabels.failed : 
                         isCurrent ? StatusLabels.in_progress : 
                         StatusLabels.pending}
                      </Badge>
                    </div>
                    
                    {roundStatus?.completedAt && (
                      <div className="mt-2 text-sm text-gray-500">
                        Completed: {formatDate(roundStatus.completedAt)}
                      </div>
                    )}
                    
                    {roundStatus?.feedback && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                        {roundStatus.feedback}
                      </div>
                    )}
                    
                    {isCurrent && !isPassed && !isFailed && (
                      <div className="mt-4 flex gap-2">
                        {/* Only show pass/fail buttons if the round is NOT an aptitude test */}
                        {round.type !== 'aptitude' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => confirmAction('pass', round._id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Pass
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmAction('fail', round._id)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Fail
                            </Button>
                          </>
                        )}
                        {round.type === 'aptitude' && (
                          <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                            <AlertCircle className="h-4 w-4 inline-block mr-1" />
                            Aptitude test results are automatically evaluated based on candidate performance.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {candidateProgress.overallStatus === 'in_process' && rounds.every(r => {
          const status = getRoundStatus(r._id);
          return status?.status === 'passed';
        }) && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">All Rounds Completed</h3>
            <p className="text-green-700 mb-4">This candidate has successfully completed all interview rounds.</p>
            <div className="flex gap-3">
              <Button
                onClick={() => confirmAction('accept')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Hire Candidate
              </Button>
              <Button
                variant="outline"
                onClick={() => confirmAction('reject')}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject Candidate
              </Button>
            </div>
          </div>
        )}
        
        {(candidateProgress.overallStatus === 'hired' || candidateProgress.overallStatus === 'rejected') && (
          <div className={`p-4 rounded-lg border ${
            candidateProgress.overallStatus === 'hired' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <h3 className={`font-medium ${
              candidateProgress.overallStatus === 'hired' ? 'text-green-800' : 'text-red-800'
            } mb-2`}>
              Final Decision: {candidateProgress.overallStatus === 'hired' ? 'Hired' : 'Rejected'}
            </h3>
            <p className={
              candidateProgress.overallStatus === 'hired' ? 'text-green-700' : 'text-red-700'
            }>
              {candidateProgress.overallStatus === 'hired' 
                ? 'This candidate has been hired for the position.' 
                : 'This candidate has been rejected for the position.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (candidateLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto pt-10 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (candidateError || !candidate) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto pt-10 px-4">
          <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
            <CardHeader className="bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <div>
                  <CardTitle className="text-xl text-red-700">API Error</CardTitle>
                  <CardDescription className="text-red-600">
                    The candidate profile could not be loaded
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                  <h3 className="text-lg font-medium text-amber-800 mb-2">Technical Details</h3>
                  <p className="text-amber-700 mb-1">
                    The backend API endpoint for candidate profiles is not responding correctly.
                  </p>
                  <p className="text-amber-700 mb-2">
                    Error message: {candidateError || "The candidate resource was not found on the server"}
                  </p>
                  <div className="bg-white p-3 rounded border border-amber-200 font-mono text-sm text-gray-700 overflow-auto">
                    GET {window.location.origin}/api/v1/candidate/{candidateId} - 404 (Not Found)
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Possible Solutions</h3>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Check that the backend server is running</li>
                    <li>Verify that the candidate endpoint is implemented on the backend</li>
                    <li>Check that the candidate ID is valid</li>
                    <li>Ensure your authentication token is valid</li>
                  </ul>
                </div>
                
                <div className="flex justify-center gap-4 pt-2">
                  <Button onClick={() => navigate(-1)} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                  </Button>
                  <Button onClick={refetch}>
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <Navbar />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto pt-10 px-4 pb-20"
      >
        {/* Back button and page title */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-6"
        >
          <Button
            variant="ghost"
            className="gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-300"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          <div className="flex items-center gap-3">
            {jobData && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 shadow-sm">
                {jobData.title}
              </Badge>
            )}
            
            {selectedApplication && (
              <Badge variant="outline" className={`px-3 py-1 shadow-sm ${StatusColors[selectedApplication.status] || StatusColors.pending}`}>
                {StatusLabels[selectedApplication.status] || 'Unknown Status'}
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Candidate header card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-blue-100 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Avatar className="h-24 w-24 border-2 border-blue-100 shadow-md">
                    {candidate.profile?.profilePhoto ? (
                      <AvatarImage 
                        src={candidate.profile.profilePhoto.startsWith('http') 
                          ? candidate.profile.profilePhoto 
                          : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/${candidate.profile.profilePhoto}`
                        } 
                        alt={candidate.fullname} 
                        onError={(e) => {
                          console.error('Error loading avatar:', e);
                          e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(candidate.fullname);
                        }}
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl">
                        {getInitials(candidate.fullname)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </motion.div>
                
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{candidate.fullname}</h1>
                  <div className="flex flex-wrap gap-2 items-center mb-3">
                    <p className="text-blue-600 font-medium">{`${candidate.profile?.courseField || ''} ${candidate.profile?.courseName ? `| ${candidate.profile?.courseName}` : ''}`}</p>
                  </div>
                  
                  {/* Skills */}
                  {candidate.profile?.skills && candidate.profile.skills.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2">
                        {candidate.profile.skills.map((skill, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                          >
                            <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 transition-colors duration-200">
                              {skill}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="gap-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 transition-all duration-200"
                    onClick={handleSendEmail}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Contact</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="gap-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 transition-all duration-200"
                    onClick={handleDownloadResume}
                  >
                    <Download className="h-4 w-4" />
                    <span>Resume</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs for different sections */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs 
            defaultValue="profile" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="bg-white border border-blue-100 rounded-lg p-1 shadow-sm">
              <TabsTrigger 
                value="profile"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 transition-all duration-200"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="pipeline"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 transition-all duration-200"
              >
                Interview Pipeline
              </TabsTrigger>
              <TabsTrigger 
                value="experience"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 transition-all duration-200"
              >
                Experience
              </TabsTrigger>
              <TabsTrigger 
                value="education"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 transition-all duration-200"
              >
                Education
              </TabsTrigger>
              <TabsTrigger 
                value="projects"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 transition-all duration-200"
              >
                Projects
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div
                  key="profile-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value="profile">
                    <Card className="border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                          <User className="h-5 w-5 text-blue-600" />
                          Profile Overview
                        </CardTitle>
                        <CardDescription className="text-blue-600/80">
                          Personal information and skills
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-6">
                          {/* About Me - Only show if bio exists */}
                          {candidate.profile?.bio && (
                            <div className="bg-blue-50/50 p-5 rounded-lg border border-blue-100">
                              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                                <User className="h-5 w-5 mr-2 text-blue-600" />
                                About
                              </h3>
                              <p className="text-gray-700">{candidate.profile.bio}</p>
                            </div>
                          )}
                          
                          {/* Additional Info */}
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Personal Details - Only show if any personal detail exists */}
                            {(candidate.email || candidate.phoneNumber || candidate.profile?.location || candidate.profile?.website) && (
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300"
                              >
                                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                                  <Mail className="h-5 w-5 mr-2 text-blue-600" />
                                  Personal Details
                                </h3>
                                <div className="space-y-3">
                                  {candidate.email && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-blue-500" />
                                      <span className="text-gray-500">Email:</span>
                                      <span className="text-gray-900">{candidate.email}</span>
                                    </div>
                                  )}
                                  
                                  {candidate.phoneNumber && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-blue-500" />
                                      <span className="text-gray-500">Phone:</span>
                                      <span className="text-gray-900">{candidate.phoneNumber}</span>
                                    </div>
                                  )}

                                  {candidate.profile?.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-blue-500" />
                                      <span className="text-gray-500">Location:</span>
                                      <span className="text-gray-900">{candidate.profile.location}</span>
                                    </div>
                                  )}
                                  
                                  {candidate.profile?.website && (
                                    <div className="flex items-center gap-2">
                                      <ExternalLink className="h-4 w-4 text-blue-500" />
                                      <span className="text-gray-500">Website:</span>
                                      <a 
                                        href={candidate.profile.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        {candidate.profile.website}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                            
                            {/* Professional Details - Only show if any professional detail exists */}
                            {(candidate.profile?.experience || 
                              candidate.profile?.preferredRole || 
                              candidate.profile?.jobType || 
                              candidate.profile?.preferredLocation || 
                              (candidate.profile?.courseName && candidate.profile?.courseField)) && (
                              <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300"
                              >
                                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                                  <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                                  Professional Details
                                </h3>
                                <div className="space-y-3">
                                  {candidate.profile?.experience && (
                                    <div className="flex items-center gap-2">
                                      <Briefcase className="h-4 w-4 text-blue-500" />
                                      <span className="text-gray-500">Experience:</span>
                                      <span className="text-gray-900">{candidate.profile.experience} years</span>
                                    </div>
                                  )}

                                  {candidate.profile?.preferredRole && (
                                    <div className="flex items-center gap-2">
                                      <Briefcase className="h-4 w-4 text-blue-500" />
                                      <span className="text-gray-500">Preferred Role:</span>
                                      <span className="text-gray-900">{candidate.profile.preferredRole}</span>
                                    </div>
                                  )}

                                  {candidate.profile?.jobType && (
                                    <div className="flex items-center gap-2">
                                      <Briefcase className="h-4 w-4 text-blue-500" />
                                      <span className="text-gray-500">Job Type:</span>
                                      <span className="text-gray-900">{candidate.profile.jobType}</span>
                                    </div>
                                  )}

                                  {candidate.profile?.preferredLocation && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-blue-500" />
                                      <span className="text-gray-500">Preferred Location:</span>
                                      <span className="text-gray-900">{candidate.profile.preferredLocation}</span>
                                    </div>
                                  )}

                                  {candidate.profile?.courseName && candidate.profile?.courseField && (
                                    <div className="flex items-center gap-2">
                                      <GraduationCap className="h-4 w-4 text-blue-500" />
                                      <span className="text-gray-500">Course:</span>
                                      <span className="text-gray-900">{candidate.profile.courseField} in {candidate.profile.courseName}</span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </motion.div>
              )}

              {activeTab === "pipeline" && (
                <motion.div
                  key="pipeline-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value="pipeline">
                    <Card className="border border-blue-100 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                          Interview Pipeline
                        </CardTitle>
                        <CardDescription className="text-blue-600/80">
                          Track candidate progress through the interview process
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {pipelineLoading ? (
                          <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                          </div>
                        ) : (
                          renderPipelineStatus()
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </motion.div>
              )}
              
              {activeTab === "experience" && (
                <motion.div
                  key="experience-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value="experience">
                    <Card className="border border-blue-100 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                          Work Experience
                        </CardTitle>
                        <CardDescription className="text-blue-600/80">
                          Professional experience and internships
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {/* Employment History - Only show section if there's data */}
                        {candidate.profile?.employmentHistory && candidate.profile.employmentHistory.length > 0 && (
                          <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Employment History</h3>
                            <div className="space-y-6">
                              {candidate.profile.employmentHistory.map((job, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                      <Briefcase className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900">{job.role}</h4>
                                      <p className="text-gray-700">{job.company}</p>
                                      <div className="flex items-center text-gray-500 text-sm mt-1">
                                        <Clock className="h-4 w-4 mr-1" />
                                        <span>{job.duration}</span>
                                      </div>
                                      <p className="text-gray-600 mt-2">{job.description}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Internships - Only show section if there's data */}
                        {candidate.profile?.internships && candidate.profile.internships.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Internships</h3>
                            <div className="space-y-6">
                              {candidate.profile.internships.map((internship, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                      <Award className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900">{internship.role}</h4>
                                      <p className="text-gray-700">{internship.company}</p>
                                      <div className="flex items-center text-gray-500 text-sm mt-1">
                                        <Clock className="h-4 w-4 mr-1" />
                                        <span>{internship.duration}</span>
                                      </div>
                                      <p className="text-gray-600 mt-2">{internship.description}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Show message if no experience data is available */}
                        {(!candidate.profile?.employmentHistory || candidate.profile.employmentHistory.length === 0) &&
                         (!candidate.profile?.internships || candidate.profile.internships.length === 0) && (
                          <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-100">
                            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No Experience Data</h3>
                            <p className="text-gray-500">This candidate hasn't added any work experience or internships yet.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </motion.div>
              )}
              
              {activeTab === "education" && (
                <motion.div
                  key="education-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value="education">
                    <Card className="border border-blue-100 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                          Education
                        </CardTitle>
                        <CardDescription className="text-blue-600/80">
                          Educational background and qualifications
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {/* College/University */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <GraduationCap className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">College/University</h3>
                              <p className="text-gray-700 mt-1">{candidate.profile?.collegeName || "Not specified"}</p>
                              <p className="text-gray-500 text-sm mt-1">
                                {candidate.profile?.courseName || "Not specified"} - {candidate.profile?.courseField || "Not specified"}
                              </p>
                              <p className="text-gray-500 text-sm mt-1">
                                Year: {candidate.profile?.collegeYear || "Not specified"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 12th Standard */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <GraduationCap className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">12th Standard</h3>
                              <p className="text-gray-700 mt-1">{candidate.profile?.twelfthSchool || "Not specified"}</p>
                              <p className="text-gray-500 text-sm mt-1">
                                Year: {candidate.profile?.twelfthYear || "Not specified"}
                              </p>
                              <p className="text-gray-500 text-sm mt-1">
                                Percentage: {candidate.profile?.twelfthPercentage || "Not specified"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 10th Standard */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <GraduationCap className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">10th Standard</h3>
                              <p className="text-gray-700 mt-1">{candidate.profile?.tenthSchool || "Not specified"}</p>
                              <p className="text-gray-500 text-sm mt-1">
                                Year: {candidate.profile?.tenthYear || "Not specified"}
                              </p>
                              <p className="text-gray-500 text-sm mt-1">
                                Percentage: {candidate.profile?.tenthPercentage || "Not specified"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </motion.div>
              )}
              
              {activeTab === "projects" && (
                <motion.div
                  key="projects-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value="projects">
                    <Card className="border border-blue-100 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                          <FileText className="h-5 w-5 text-blue-600" />
                          Projects
                        </CardTitle>
                        <CardDescription className="text-blue-600/80">
                          Academic and personal projects
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {candidate.profile?.projects && candidate.profile.projects.length > 0 ? (
                          <div className="grid gap-6 md:grid-cols-2">
                            {candidate.profile.projects.map((project, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {project.technologies}
                                  </Badge>
                                  <div className="text-gray-500 text-xs">
                                    {project.duration}
                                  </div>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                                {project.link && (
                                  <a 
                                    href={project.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span>View Project</span>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-center">
                            <p className="text-gray-500">No projects available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-md mx-auto rounded-xl border border-blue-100 shadow-lg">
          <DialogHeader className="border-b border-blue-100 pb-4">
            <DialogTitle className="text-blue-800 flex items-center gap-2">
              {pendingAction === 'pass' ? <CheckCircle className="h-5 w-5 text-green-500" /> : 
               pendingAction === 'fail' ? <XCircle className="h-5 w-5 text-red-500" /> : 
               pendingAction === 'accept' ? <CheckCircle className="h-5 w-5 text-green-500" /> : 
               pendingAction === 'reject' ? <XCircle className="h-5 w-5 text-red-500" /> : 
               pendingAction === 'initial-accept' ? <CheckCircle className="h-5 w-5 text-green-500" /> : 
               pendingAction === 'initial-reject' ? <XCircle className="h-5 w-5 text-red-500" /> : 
               <AlertCircle className="h-5 w-5 text-blue-500" />}
              {pendingAction === 'pass' ? 'Pass Candidate' : 
               pendingAction === 'fail' ? 'Fail Candidate' : 
               pendingAction === 'accept' ? 'Hire Candidate' : 
               pendingAction === 'reject' ? 'Reject Candidate' : 
               pendingAction === 'initial-accept' ? 'Accept Application' : 
               pendingAction === 'initial-reject' ? 'Reject Application' : 
               'Confirm Action'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {pendingAction === 'pass' ? 'Are you sure you want to pass this candidate to the next round?' : 
               pendingAction === 'fail' ? 'Are you sure you want to fail this candidate for this round?' : 
               pendingAction === 'accept' ? 'Are you sure you want to hire this candidate?' : 
               pendingAction === 'reject' ? 'Are you sure you want to reject this candidate?' : 
               pendingAction === 'initial-accept' ? 'Are you sure you want to accept this application and add the candidate to the interview pipeline?' : 
               pendingAction === 'initial-reject' ? 'Are you sure you want to reject this application?' : 
               'Are you sure you want to proceed with this action?'}
            </DialogDescription>
          </DialogHeader>

          {(pendingAction === 'pass' || pendingAction === 'fail') && (
            <div className="py-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Feedback
              </label>
              <Textarea 
                value={feedback} 
                onChange={(e) => setFeedback(e.target.value)} 
                placeholder="Provide feedback about this decision"
                className="w-full border-blue-200 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md"
              />
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-blue-100 mt-4">
            <DialogClose asChild>
              <Button variant="outline" className="border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              variant={
                pendingAction === 'pass' || pendingAction === 'accept' || pendingAction === 'initial-accept' 
                  ? 'default' 
                  : 'destructive'
              }
              className={
                pendingAction === 'pass' || pendingAction === 'accept' || pendingAction === 'initial-accept'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all'
                  : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-md hover:shadow-lg transition-all'
              }
              onClick={executePendingAction}
              disabled={processingAction}
            >
              {processingAction ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {pendingAction === 'pass' ? 'Pass Candidate' : 
                   pendingAction === 'fail' ? 'Fail Candidate' : 
                   pendingAction === 'accept' ? 'Hire Candidate' : 
                   pendingAction === 'reject' ? 'Reject Candidate' : 
                   pendingAction === 'initial-accept' ? 'Accept Application' : 
                   pendingAction === 'initial-reject' ? 'Reject Application' : 
                   'Confirm'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateProfile; 






