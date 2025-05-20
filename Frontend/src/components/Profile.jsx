import React, { useState, lazy, Suspense, useEffect } from 'react';
import Navbar from './shared/Navbar';
import { Avatar, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Contact, Mail, Pen, MapPin, Calendar, CakeIcon, FileText, Download, ChevronDown, ChevronUp, User, Briefcase, Sparkles, Pencil, GraduationCapIcon, Code2Icon, AlertTriangle, CheckCircle2, LineChart, Loader2, FileX, Upload } from 'lucide-react';
import UpdateProfileDialog from './UpdateProfileDialog';
import { useSelector } from 'react-redux';
import UseGetAppliedJobs from '@/hooks/UseGetAppliedJobs';
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import logo from "../assets/images/user.jpg";
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from './ui/badge';
import toast from 'react-hot-toast';
import { RESUME_API_END_POINT } from '@/utils/constant';


// Lazy loaded components
const AppliedJobTable = lazy(() => import('./AppliedJobTable'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="w-full py-8 flex justify-center items-center">
    <div className="animate-pulse flex flex-col items-center">
      <div className="h-8 w-8 bg-blue-200 rounded-full mb-2"></div>
      <div className="h-4 w-24 bg-slate-200 rounded"></div>
    </div>
  </div>
);

// Custom shadow class
const cardShadow = "shadow-[0_4px_15px_-2px_rgba(66,153,225,0.12)]";

const Profile = () => {
  UseGetAppliedJobs();
  const [open, setOpen] = useState(false);
  const [isJobsExpanded, setIsJobsExpanded] = useState(false);
  const [shouldLoadJobs, setShouldLoadJobs] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const { user } = useSelector((store) => store.auth);

  // Profile Completion Progress Calculation
  const calculateProfileProgress = () => {
    if (!user?.profile) return 0;
    let fields = ["profilePhoto", "bio", "skills", "resume", "courseName", "courseField"];
    let filledFields = fields.filter((field) => user.profile[field]);
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const profileProgress = calculateProfileProgress();

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // State to store resume analysis data
    const [resumeAnalysis, setResumeAnalysis] = useState(user?.profile?.resumeAnalysis || null);
    
    // State for popup alerts
    const [showCachedAlert, setShowCachedAlert] = useState(false);
    const [showNewAnalysisAlert, setShowNewAnalysisAlert] = useState(false);

    const analyzeResume = async () => {
      if (isAnalyzing) return; // Prevent multiple clicks
      
      try {
        setIsAnalyzing(true);
        console.log('Starting resume analysis for user:', user?._id);
        
        // Show a loading toast to indicate the process has started
        const loadingToast = toast.loading('Analyzing your resume... This may take up to 15 seconds.');
        
        // Make the API request
        const response = await fetch(`${RESUME_API_END_POINT}/analyze`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user?._id }),
        });
        
        const data = await response.json();
        console.log('Resume analysis response:', data);
        
        // Dismiss the loading toast
        toast.dismiss(loadingToast);
        
        if (response.ok) {
          // Update the local state with the analysis results
          if (data.analysis) {
            // Only update the local state, don't try to modify the Redux store directly
            setResumeAnalysis(data.analysis);
            
            // Note: The user object from Redux is immutable
            // The profile will be updated in Redux when the page refreshes or when
            // the user data is fetched again from the server
          }
          
          // Check if the analysis was cached
          if (data.isCached) {
            // Show cached analysis message
            toast.success('Using cached resume analysis');
            setShowCachedAlert(true);
            setShowNewAnalysisAlert(false);
          } else {
            // Show new analysis message
            toast.success('Resume analyzed successfully!');
            setShowNewAnalysisAlert(true);
            setShowCachedAlert(false);
          }
        } else {
          // Handle error response
          throw new Error(data.message || 'Failed to analyze resume');
        }
      } catch (error) {
        console.error('Error analyzing resume:', error);
        toast.error(error.message || 'Failed to analyze resume');
      } finally {
        setIsAnalyzing(false);
      }
    };


  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 64; // Height of the navbar in pixels
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navbarHeight - 24; // Added extra 24px padding for visual comfort

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  // Load jobs data only when section is expanded
  useEffect(() => {
    if (isJobsExpanded) {
      setShouldLoadJobs(true);
    }
  }, [isJobsExpanded]);

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['about', 'skills', 'preferences', 'education', 'internships', 'projects', 'employment', 'jobs'];
      const navbarHeight = 64;
      
      // Find the section closest to the top of the viewport
      let closestSection = null;
      let closestDistance = Infinity;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          const distance = Math.abs(rect.top - navbarHeight);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestSection = section;
          }
        }
      }

      if (closestSection) {
        setActiveSection(closestSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on mount to set initial active section
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Quick Links section styling
  const getLinkStyles = (section) => {
    const baseStyles = "w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-md transition-all duration-200";
    const activeStyles = "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 font-medium border-r-4 border-blue-600";
    const inactiveStyles = "text-gray-600 hover:bg-gray-50 hover:text-blue-600";
    
    return `${baseStyles} ${activeSection === section ? activeStyles : inactiveStyles}`;
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <div className="max-w-8xl ml-14 mr-20 px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Left Column - Quick Links */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`bg-white rounded-xl ${cardShadow} p-4 sticky top-6`}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => scrollToSection('about')}
                  className={getLinkStyles('about')}
                >
                  <User className={`w-4 h-4 ${activeSection === 'about' ? 'text-blue-600' : 'text-gray-500'}`} />
                  About Me
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => scrollToSection('skills')}
                  className={getLinkStyles('skills')}
                >
                  <Sparkles className={`w-4 h-4 ${activeSection === 'skills' ? 'text-blue-600' : 'text-gray-500'}`} />
                  Skills
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => scrollToSection('preferences')}
                  className={getLinkStyles('preferences')}
                >
                  <MapPin className={`w-4 h-4 ${activeSection === 'preferences' ? 'text-blue-600' : 'text-gray-500'}`} />
                  Preferences
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => scrollToSection('education')}
                  className={getLinkStyles('education')}
                >
                  <GraduationCapIcon className={`w-4 h-4 ${activeSection === 'education' ? 'text-blue-600' : 'text-gray-500'}`} />
                  Education
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => scrollToSection('internships')}
                  className={getLinkStyles('internships')}
                >
                  <Briefcase className={`w-4 h-4 ${activeSection === 'internships' ? 'text-blue-600' : 'text-gray-500'}`} />
                  Internships
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => scrollToSection('projects')}
                  className={getLinkStyles('projects')}
                >
                  <Code2Icon className={`w-4 h-4 ${activeSection === 'projects' ? 'text-blue-600' : 'text-gray-500'}`} />
                  Projects
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => scrollToSection('employment')}
                  className={getLinkStyles('employment')}
                >
                  <Briefcase className={`w-4 h-4 ${activeSection === 'employment' ? 'text-blue-600' : 'text-gray-500'}`} />
                  Employment
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => scrollToSection('jobs')}
                  className={getLinkStyles('jobs')}
                >
                  <Briefcase className={`w-4 h-4 ${activeSection === 'jobs' ? 'text-blue-600' : 'text-gray-500'}`} />
                  Applied Jobs
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`bg-white rounded-xl ${cardShadow} p-6 border border-blue-50`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSection('profile')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </motion.div>
              </div>
              <div className="flex gap-8">
                {/* Left: Avatar and Progress */}
                <div className="flex-shrink-0">
                  <motion.div 
                    className="relative w-24 h-24"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {profileProgress < 100 && (
                      <CircularProgressbar
                        value={profileProgress}
                        strokeWidth={5}
                        styles={buildStyles({
                          pathColor: profileProgress < 50 ? "#ef4444" : profileProgress < 80 ? "#f97316" : "#22c55e",
                          trailColor: "#f1f5f9",
                          strokeLinecap: "round"
                        })}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Avatar className="h-20 w-20 rounded-full ring-2 ring-white">
                        <AvatarImage src={user?.profile?.profilePhoto || logo} className="object-cover" />
                      </Avatar>
                    </div>
                  </motion.div>
                </div>

                {/* Middle: User Info */}
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <motion.h1 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                      >
                        {user?.fullname}
                      </motion.h1>
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-500 text-sm mt-1"
                      >
                        {user?.profile?.courseField && user?.profile?.courseName
                          ? `${user.profile.courseField} / ${user.profile.courseName}`
                          : "Course not provided"}
                      </motion.p>
                    </div>
                  </div>

                  {/* Contact Grid */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-600 text-sm">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center gap-2"
                    >
                      <div className="p-1.5 bg-blue-50 rounded-md">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <span>{user?.email}</span>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center gap-2"
                    >
                      <div className="p-1.5 bg-blue-50 rounded-md">
                        <Contact className="w-4 h-4 text-blue-600" />
                      </div>
                      <span>{user?.phoneNumber || "No phone number"}</span>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-center gap-2"
                    >
                      <div className="p-1.5 bg-blue-50 rounded-md">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <span>{user?.profile?.location || "No location"}</span>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="flex items-center gap-2"
                    >
                      <div className="p-1.5 bg-blue-50 rounded-md">
                        <CakeIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <span>
                        {user?.profile?.dob ? new Date(user.profile.dob).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        }) : "Not Provided"}
                      </span>
                    </motion.div>
                  </div>
                </div>

                {/* Right: Resume */}
                <div className="flex-shrink-0 md:border-l md:border-gray-100 md:pl-8 md:ml-4">
                  <div className="w-full md:w-48">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Resume</h3>
                    {user?.profile?.resume ? (
                      <motion.div 
                        whileHover={{ scale: 1.03 }}
                        className="flex items-center gap-3 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md hover:shadow-md transition-all duration-300 border border-blue-100"
                      >
                        <div className="p-2 bg-white rounded-md">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.profile?.resumeOriginalName || "Resume"}
                          </p>
                          <p className="text-xs text-gray-500">PDF Document</p>
                        </div>
                        <motion.a
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          href={user?.profile?.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Download className="w-4 h-4 text-blue-600 hover:text-blue-700" />
                        </motion.a>
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 text-sm p-2 bg-white rounded-md border border-gray-200">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>No resume uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Profile Progress Bar - Only show if not 100% */}
              {profileProgress < 100 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-100"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-700">Complete your profile</span>
                    <span className="text-xs font-semibold text-blue-600">{profileProgress}%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${profileProgress}%` }}
                      transition={{ delay: 1, duration: 1 }}
                      className="h-2.5 rounded-full"
                      style={{ 
                        backgroundColor: profileProgress < 50 ? "#ef4444" : profileProgress < 80 ? "#f97316" : "#22c55e"
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Resume Analysis */}
            <motion.div 
              id="resume-analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`bg-white rounded-xl ${cardShadow} p-6 border border-blue-50`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Resume Analysis</h2>
                {user?.profile?.resume && (
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Button
                      onClick={analyzeResume}
                      disabled={isAnalyzing}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      {isAnalyzing ? "Analyzing..." : "Run Analysis"}
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Cached analysis alert */}
              {showCachedAlert && (
                <div className="fixed top-20 right-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-lg z-50 max-w-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">Using cached analysis from {new Date(resumeAnalysis?.analyzedAt).toLocaleDateString()}</p>
                      <p className="text-xs mt-1">Your resume hasn't changed since the last analysis.</p>
                    </div>
                    <button 
                      onClick={() => setShowCachedAlert(false)}
                      className="ml-auto -mx-1.5 -my-1.5 bg-blue-50 text-blue-500 rounded-lg p-1.5 hover:bg-blue-100"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* New analysis alert */}
              {showNewAnalysisAlert && (
                <div className="fixed top-20 right-4 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50 max-w-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">New resume analysis completed!</p>
                      <p className="text-xs mt-1">Your resume has been analyzed with the latest content.</p>
                    </div>
                    <button 
                      onClick={() => setShowNewAnalysisAlert(false)}
                      className="ml-auto -mx-1.5 -my-1.5 bg-green-50 text-green-500 rounded-lg p-1.5 hover:bg-green-100"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {!user?.profile?.resume ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <FileX className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium mb-1">No Resume Uploaded</p>
                  <p className="text-gray-400 text-sm mb-4">Upload a resume to enable AI-powered analysis</p>
                </div>
              ) : (resumeAnalysis?.strengths?.length > 0 || user?.profile?.resumeAnalysis?.strengths?.length > 0) ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-md font-medium text-gray-900">ATS Score</h3>
                    <div className="w-16 h-16">
                      <CircularProgressbar
                        value={(resumeAnalysis?.atsScore || user.profile.resumeAnalysis?.atsScore || 0)}
                        text={`${(resumeAnalysis?.atsScore || user.profile.resumeAnalysis?.atsScore || 0)}%`}
                        styles={buildStyles({
                          textSize: '28px',
                          pathColor: (resumeAnalysis?.atsScore || user.profile.resumeAnalysis?.atsScore || 0) < 50 ? "#ef4444" : 
                                    (resumeAnalysis?.atsScore || user.profile.resumeAnalysis?.atsScore || 0) < 70 ? "#f97316" : "#22c55e",
                          textColor: '#1e293b',
                          trailColor: '#f1f5f9',
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <h3 className="text-sm font-medium text-gray-900">Strengths</h3>
                      </div>
                      <ul className="space-y-1 pl-7 list-disc text-sm text-gray-600">
                        {(resumeAnalysis?.strengths || user.profile.resumeAnalysis?.strengths || []).map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <h3 className="text-sm font-medium text-gray-900">Areas for Improvement</h3>
                      </div>
                      <ul className="space-y-1 pl-7 list-disc text-sm text-gray-600">
                        {(resumeAnalysis?.weaknesses || user.profile.resumeAnalysis?.weaknesses || []).map((weakness, index) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <LineChart className="h-5 w-5 text-blue-600" />
                      <h3 className="text-sm font-medium text-gray-900">Suggestions</h3>
                    </div>
                    <ul className="space-y-1 pl-7 list-disc text-sm text-gray-600">
                      {(resumeAnalysis?.suggestions || user.profile.resumeAnalysis?.suggestions || []).map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="max-w-md mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                    <div className="bg-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-sm">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Resume Uploaded Successfully!</h3>
                    <p className="text-gray-600 mb-6">
                      Your resume is ready for AI analysis. Get detailed insights about your resume's effectiveness and suggestions for improvement.
                    </p>
                    <Button
                      onClick={analyzeResume}
                      disabled={isAnalyzing}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Analyzing Resume...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Analyze My Resume
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-gray-500 mt-4">
                      The analysis will evaluate your resume's ATS compatibility, highlight your strengths, and suggest improvements.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Bio Card */}
            <motion.div 
              id="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`bg-white rounded-xl ${cardShadow} p-6 border border-blue-50 scroll-mt-24`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">About Me</h2>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSection('bio')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </motion.div>
              </div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 text-sm leading-relaxed"
              >
                {user?.profile?.bio || "No bio provided."}
              </motion.p>
            </motion.div>

            {/* Skills Card */}
            <motion.div 
              id="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`bg-white rounded-xl ${cardShadow} p-6 border border-blue-50 scroll-mt-24`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSection('skills')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </motion.div>
              </div>
              <div className="flex flex-wrap gap-2">
                {user?.profile?.skills?.length > 0 ? (
                  user?.profile?.skills.map((skill, index) => (
                    <motion.span 
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.05, backgroundColor: "#EBF5FF" }}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-sm font-medium hover:shadow-sm transition-all duration-200 border border-blue-100"
                    >
                      {skill}
                    </motion.span>
                  ))
                ) : (
                  <p className="text-gray-600 text-sm">No skills listed</p>
                )}
              </div>
            </motion.div>

            {/* Preferences Card */}
            <motion.div 
              id="preferences"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className={`bg-white rounded-xl ${cardShadow} p-6 border border-blue-50 scroll-mt-24`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Your Preferences</h2>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSection('preferences')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </motion.div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                >
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Preferred Location</h3>
                  <p className="text-gray-600 text-sm">
                    {user?.profile?.preferredLocation || "Not specified"}
                  </p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                >
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Job Type</h3>
                  <p className="text-gray-600 text-sm">
                    {user?.profile?.jobType || "Not specified"}
                  </p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                >
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Preferred Role</h3>
                  <p className="text-gray-600 text-sm">
                    {user?.profile?.preferredRole || "Not specified"}
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Education Card */}
            <motion.div 
              id="education"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`bg-white rounded-xl ${cardShadow} p-6 border border-blue-50 scroll-mt-24`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Education</h2>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSection('education')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </motion.div>
              </div>
              <div className="space-y-6">
                {/* College Education */}
                <div className="border-l-2 border-blue-600 pl-4">
                  <h3 className="text-sm font-medium text-gray-900">College Education</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {user?.profile?.courseName ? (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <GraduationCapIcon className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{user.profile.courseField} in {user.profile.courseName}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-500">{user?.profile?.collegeName || "College name not specified"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-500">{user?.profile?.collegeYear || "Year not specified"}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>College education not specified</span>
                      </div>
                    )}
                  </p>
                </div>

                {/* 12th Education */}
                <div className="border-l-2 border-blue-600 pl-4">
                  <h3 className="text-sm font-medium text-gray-900">12th Standard</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {user?.profile?.twelfthSchool ? (
                      <>
                        <span className="font-medium">{user.profile.twelfthSchool}</span>
                        <br />
                        <span className="text-gray-500">Year: {user?.profile?.twelfthYear || "Not specified"}</span>
                        <br />
                        <span className="text-gray-500">Percentage: {user?.profile?.twelfthPercentage || "Not specified"}</span>
                      </>
                    ) : (
                      "12th education details not specified"
                    )}
                  </p>
                </div>

                {/* 10th Education */}
                <div className="border-l-2 border-blue-600 pl-4">
                  <h3 className="text-sm font-medium text-gray-900">10th Standard</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {user?.profile?.tenthSchool ? (
                      <>
                        <span className="font-medium">{user.profile.tenthSchool}</span>
                        <br />
                        <span className="text-gray-500">Year: {user?.profile?.tenthYear || "Not specified"}</span>
                        <br />
                        <span className="text-gray-500">Percentage: {user?.profile?.tenthPercentage || "Not specified"}</span>
                      </>
                    ) : (
                      "10th education details not specified"
                    )}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Internships Card */}
            <motion.div 
              id="internships"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className={`bg-white rounded-xl ${cardShadow} p-6 border border-blue-50 scroll-mt-24`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Internships</h2>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSection('internships')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </motion.div>
              </div>
              {user?.profile?.internships?.length > 0 ? (
                <div className="space-y-6">
                  {user.profile.internships.map((internship, index) => (
                    <div key={index} className="border-l-2 border-blue-600 pl-4">
                      <h3 className="text-sm font-medium text-gray-900">{internship.role}</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        <span className="font-medium">{internship.company}</span>
                        <br />
                        <span className="text-gray-500">{internship.duration}</span>
                        <br />
                        <span className="text-gray-500">{internship.description}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No internships listed</p>
              )}
            </motion.div>

            {/* Projects Card */}
            <motion.div 
              id="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`bg-white rounded-xl ${cardShadow} p-6 border border-blue-50 scroll-mt-24`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSection('projects')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </motion.div>
              </div>
              {user?.profile?.projects?.length > 0 ? (
                <div className="space-y-6">
                  {user.profile.projects.map((project, index) => (
                    <div key={index} className="border-l-2 border-blue-600 pl-4">
                      <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        <span className="font-medium">{project.technologies}</span>
                        <br />
                        <span className="text-gray-500">{project.duration}</span>
                        <br />
                        <span className="text-gray-500">{project.description}</span>
                      </p>
                      {project.link && (
                        <a 
                          href={project.link} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                        >
                          View Project →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No projects listed</p>
              )}
            </motion.div>

            {/* Employment History Card */}
            <motion.div 
              id="employment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className={`bg-white rounded-xl ${cardShadow} p-6 border border-blue-50 scroll-mt-24`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Employment History</h2>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSection('employment')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </motion.div>
              </div>
              {user?.profile?.employmentHistory?.length > 0 ? (
                <div className="space-y-6">
                  {user.profile.employmentHistory.map((job, index) => (
                    <div key={index} className="border-l-2 border-blue-600 pl-4">
                      <h3 className="text-sm font-medium text-gray-900">{job.role}</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        <span className="font-medium">{job.company}</span>
                        <br />
                        <span className="text-gray-500">{job.duration}</span>
                        <br />
                        <span className="text-gray-500">{job.description}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No employment history listed</p>
              )}
            </motion.div>

            {/* Applied Jobs Card */}
            <motion.div 
              id="jobs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`bg-white rounded-xl ${cardShadow} p-6 border border-blue-50 scroll-mt-24`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Applied Jobs</h2>
              </div>
              <button
                onClick={() => setIsJobsExpanded(!isJobsExpanded)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h2 className="text-lg font-semibold text-gray-900 text-left">Applied Jobs</h2>
                <div className="flex items-center gap-4">
                  {isJobsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </button>
              
              <div className={`transition-all duration-300 ${isJobsExpanded ? 'max-h-[2000px]' : 'max-h-0'} overflow-hidden`}>
                <p className="text-gray-500 text-sm mb-4">Track your job applications and their status</p>
                {isJobsExpanded && shouldLoadJobs && (
                  <Suspense fallback={<LoadingFallback />}>
                    <AppliedJobTable />
                  </Suspense>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <UpdateProfileDialog 
        open={open} 
        setOpen={setOpen} 
        editingSection={editingSection}
        setEditingSection={setEditingSection}
      />
    </div>
  );
};

export default Profile;