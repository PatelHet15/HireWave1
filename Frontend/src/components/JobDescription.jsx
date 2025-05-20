import React, { useEffect, useState, lazy, Suspense } from "react";
import { Button } from "./ui/button";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { JOB_API_END_POINT, APPLICATION_API_END_POINT, COMPANY_API_END_POINT, ANALYTICS_API_END_POINT } from "@/utils/constant";
import { setSingleJob, setSimilarJobs } from "@/Redux/jobSlice";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  Building,
  Briefcase,
  DollarSign,
  Users,
  Calendar,
  Clock,
  File,
  MapPin,
  ChevronLeft,
  Share2,
  ExternalLink,
  GraduationCap,
  BadgeCheck,
  ArrowRight,
  ThumbsUp,
  Trophy,
} from "lucide-react";
import Navbar from "./shared/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

// Lazy loaded components
const SimilarJobs = lazy(() => import('./SimilarJobs'));

// Loading fallback components
const SimilarJobsSkeleton = () => (
  <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 lg:w-[30%] w-full animate-pulse">
    <div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
            <div>
              <div className="h-4 w-28 bg-slate-200 rounded mb-1"></div>
              <div className="h-3 w-20 bg-slate-200 rounded"></div>
            </div>
          </div>
          <div className="h-5 w-3/4 bg-slate-200 rounded mb-2"></div>
          <div className="h-3 w-1/2 bg-slate-200 rounded mb-4"></div>
          <div className="flex justify-between">
            <div className="h-4 w-16 bg-slate-200 rounded"></div>
            <div className="h-4 w-16 bg-slate-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const JobDescription = () => {
  const singleJob = useSelector((store) => store.job.singleJob);
  const similarJobs = useSelector((store) => store.job.similarJobs) || [];
  const { user } = useSelector((store) => store.auth);
  const [isApplied, setIsApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const params = useParams();
  const jobId = params.id;
  const dispatch = useDispatch();

  // Get company initials as fallback
  const getCompanyInitials = (name) => {
    if (!name) return "CO";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const applyJobHandler = async () => {
    if (!user) {
      toast.error("Please sign in to apply for jobs");
      navigate('/login');
      return;
    }

    try {
      // Track apply button click for analytics first
      try {
        if (user?._id && user.role === 'student') {
          // Get token from localStorage
          const token = localStorage.getItem('token');
          if (!token) {
            console.log('Apply click not tracked: No auth token available');
          } else {
            console.log('Tracking apply click for job ID:', jobId, 'User:', { id: user._id, role: user.role });
            const trackResponse = await axios.post(`${ANALYTICS_API_END_POINT}/job/${jobId}/apply-click`, {}, {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            console.log('Apply click tracking response:', trackResponse.data);
          }
        } else {
          console.log('Apply click not tracked: User not logged in or not a student');
        }
      } catch (analyticsError) {
        console.error("Error tracking apply button click:", analyticsError.response?.data || analyticsError.message);
        // Non-critical error, don't show to user
      }
      
      setIsApplying(true);
      // Check if user data exists
      const userData = localStorage.getItem('user');
      if (!userData) {
        toast.error("Please login to apply for this job");
        navigate('/login');
        return;
      }
  
      const res = await axios.post(`${APPLICATION_API_END_POINT}/apply/${jobId}`, {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.data.success) {
        toast.success("Application submitted successfully!");
        setIsApplied(true);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again");
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || "Application failed");
      }
    }
  };
  
  // Track job view - separate function to ensure it's called regardless of other operations
  const trackJobView = async () => {
    if (!user?._id) {
      console.log('Job view not tracked: User not logged in');
      return;
    }
    
    // Only track views for students
    if (user.role !== 'student') {
      console.log('Job view not tracked: User role is not student');
      return;
    }
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('Job view not tracked: No auth token available');
        return;
      }
      
      console.log('Tracking job view for job ID:', jobId, 'User:', { id: user._id, role: user.role });
      const response = await axios.post(
        `${ANALYTICS_API_END_POINT}/job/${jobId}/view`,
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('Job view tracking response:', response.data);
    } catch (error) {
      console.error('Error tracking job view:', error.response?.data || error.message);
      // Non-critical error, don't show to user
    }
  };
  
  const fetchSingleJob = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`);
      
      if (response.data.success) {
        dispatch(setSingleJob(response.data.job));
        
        if (response.data.similarJobs) {
          dispatch(setSimilarJobs(response.data.similarJobs));
        }
        
        // Check if user has already applied
        if (user) {
          try {
            const applicationResponse = await axios.get(`${APPLICATION_API_END_POINT}/check/${jobId}`, {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (applicationResponse.data.success) {
              setIsApplied(applicationResponse.data.hasApplied);
            }
          } catch (error) {
            console.error("Error checking application status:", error);
          }
          
          // Track the job view after successfully fetching job details
          await trackJobView();
        }
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      // Don't show error toast for unauthenticated users
      if (user) {
        toast.error("Failed to load job details");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (jobId) {
      fetchSingleJob();
      
      // Log page view for analytics purposes
      console.log(`Job Description page viewed for job ID: ${jobId}`);
    }
    
    // Reset state when jobId changes
    return () => {
      setIsApplied(false);
      setIsLoading(true);
    };
  }, [jobId]);

  // Format date string to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate days left to apply
  const calculateDaysLeft = (applyByDate) => {
    if (!applyByDate) return null;
    
    const today = new Date();
    const deadline = new Date(applyByDate);
    const differenceInTime = deadline - today;
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return differenceInDays;
  };

  const daysLeft = calculateDaysLeft(singleJob?.applyBy);
  
  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="w-full h-6 bg-gray-200 rounded-md mb-4 animate-pulse"></div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main content skeleton */}
            <div className="lg:w-[70%] w-full">
              <div className="bg-white shadow-sm rounded-xl p-6 mb-6 animate-pulse">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-3 w-3/4">
                    <div className="h-8 bg-gray-200 rounded-md w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-1/3"></div>
                  </div>
                  <div className="h-14 bg-gray-200 rounded-md w-32"></div>
                </div>
                
                <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="space-y-3">
                      <div className="h-5 bg-gray-200 rounded-md w-40"></div>
                      <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                      <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <SimilarJobsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center text-sm text-gray-600">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center hover:text-blue-600 transition-colors"
          >
            <ChevronLeft size={16} className="mr-1" />
            <span>Back to Jobs</span>
          </button>

        </div>
      
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content - Job Details */}
          <div className="lg:w-[70%] w-full space-y-6">
            {/* Job Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between">
                <div className="flex gap-4">
                  {/* Company Logo */}
                  <Avatar className="h-16 w-16 border border-gray-200">
                    {singleJob?.company?.logo ? (
                      <AvatarImage src={singleJob?.company?.logo} alt={singleJob.company.name} />
                    ) : (
                      <AvatarFallback className="bg-blue-50 text-blue-700">
                        {getCompanyInitials(singleJob?.company?.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  {/* Job Title & Company Info */}
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                      {singleJob?.title || "Job Title Not Available"}
                    </h1>
                    <div className="flex items-center mt-1 text-gray-600">
                      <Building size={15} className="mr-1.5" />
                      <span className="font-medium">
                        {singleJob?.company?.name || "Company Name Not Available"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-1" />
                        <span>{singleJob?.jobLocation || "Location Not Available"}</span>
                      </div>
                      <div className="flex items-center">
                        <Briefcase size={14} className="mr-1" />
                        <span>{singleJob?.jobType || "Job Type Not Available"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Job Actions */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button 
                      className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      aria-label="Share job"
                    >
                      <Share2 size={20} />
                    </button>
                  </div>
                  <Button
                    onClick={applyJobHandler}
                    disabled={isApplied || isApplying}
                    className={`px-5 py-2 rounded-lg text-sm transition-all ${
                      isApplied || isApplying
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md hover:shadow-blue-200"
                    }`}
                  >
                    {isApplied ? "Already Applied" : isApplying ? "Applying..." : "Apply Now"}
                  </Button>
                </div>
              </div>
              
              {/* Job Post Highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Salary</span>
                  <span className="text-sm font-medium text-gray-800 flex items-center">
                    <DollarSign size={15} className="mr-1 text-blue-600" />
                    {singleJob?.salary ? `${singleJob.salary} LPA` : "Not Disclosed"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Experience Level</span>
                  <span className="text-sm font-medium text-gray-800 flex items-center">
                    <GraduationCap size={15} className="mr-1 text-blue-600" />
                    {singleJob?.experienceLevel || "Not Specified"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Openings</span>
                  <span className="text-sm font-medium text-gray-800 flex items-center">
                    <Users size={15} className="mr-1 text-blue-600" />
                    {singleJob?.openings || "Not Specified"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Apply By</span>
                  <span className="text-sm font-medium text-gray-800 flex items-center">
                    <Calendar size={15} className="mr-1 text-blue-600" />
                    {formatDate(singleJob?.applyBy)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Job Details Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <File className="mr-2 text-blue-600" size={18} />
                Job Description
              </h2>
              <div className="prose prose-sm max-w-none text-gray-700">
                <p className="whitespace-pre-line">{singleJob?.description || "Job description not available."}</p>
              </div>
              
              {/* Required Skills */}
              {singleJob?.requirements?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    <BadgeCheck className="mr-2 text-blue-600" size={18} />
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {singleJob.requirements.map((skill, index) => (
                      <Badge key={index} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* About Company */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Building className="mr-2 text-blue-600" size={18} />
                About {singleJob?.company?.name || "the Company"}
              </h2>
              
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border border-gray-200">
                  {singleJob?.company?.logo ? (
                    <AvatarImage src={singleJob.company.logo} alt={singleJob.company.name} />
                  ) : (
                    <AvatarFallback className="bg-blue-50 text-blue-700">
                      {getCompanyInitials(singleJob?.company?.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1">
                  <p className="text-gray-700 whitespace-pre-line">
                    {singleJob?.company?.aboutCompany || "Company description not available."}
                  </p>
                  
                  <div className="flex flex-wrap gap-6 mt-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin size={14} className="mr-1.5 text-blue-600" />
                      <span>{singleJob?.company?.location || "Location not specified"}</span>
                    </div>
                    {singleJob?.company?.website && (
                      <a 
                        href={singleJob.company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink size={14} className="mr-1.5" />
                        <span>Visit Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Apply Now CTA */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Interested in this position?</h3>
                  <p className="text-gray-600 mt-1">
                    {user ? 
                      "Apply now and take the next step in your career journey." :
                      "Sign in to apply and take the next step in your career journey."}
                  </p>
                </div>
                {user ? (
                  <Button
                    onClick={applyJobHandler}
                    disabled={isApplied || isApplying}
                    className={`px-5 py-6 rounded-lg transition-all ${
                      isApplied || isApplying
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                    }`}
                  >
                    {isApplied ? "Already Applied" : isApplying ? "Applying..." : "Apply Now"}
                    {!isApplied && !isApplying && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/login')}
                    className="px-5 py-6 rounded-lg transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                  >
                    Sign in to Apply
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar - Similar Jobs */}
          <div className="lg:w-[30%] w-full">
            <Suspense fallback={<SimilarJobsSkeleton />}>
              <SimilarJobs similarJobs={similarJobs} navigate={navigate} />
            </Suspense>
            
            {/* Why Apply Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                <Trophy className="mr-2 text-blue-600" size={18} />
                Why Apply for This Job
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Career Growth</p>
                    <p className="text-xs text-gray-500">Opportunity to develop professional skills</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Competitive Salary</p>
                    <p className="text-xs text-gray-500">Attractive compensation package</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Respected Company</p>
                    <p className="text-xs text-gray-500">Join a leading organization in the industry</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDescription;