import React, { useState, useEffect, useMemo } from 'react';
import LatestJobCards from './LatestJobCards';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowRight, TrendingUp, Clock, Briefcase } from 'lucide-react';
import useGetAllJobs from '@/hooks/useGetAllJobs';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const LatestJobs = () => {
  const navigate = useNavigate();
  // Use the hook to ensure jobs are fetched
  useGetAllJobs();
  const { allJobs } = useSelector(store => store.job);
  
  // State for loading and displayed jobs
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(6);
  const [activeTab, setActiveTab] = useState('latest'); // 'latest' or 'top'
  
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };
  
  // Calculate a job score based on database model fields
  const calculateJobScore = (job) => {
    let score = 0;
    
    // Base score factors from job model
    
    // Salary (higher is better)
    const salary = parseInt(job?.salary) || 0;
    if (salary > 0) {
      // Logarithmic scale to prevent extremely high salaries from dominating
      score += Math.min(50, Math.log(salary) * 10);
    }
    
    // Urgency factor - jobs closer to deadline get priority
    if (job?.applyBy) {
      const now = new Date();
      const deadline = new Date(job.applyBy);
      const daysLeft = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
      
      // Jobs with 0-7 days left get higher urgency scores
      if (daysLeft <= 7) {
        score += Math.max(0, 30 - (daysLeft * 4)); // 30 points for today, down to 2 for 7 days
      }
    }
    
    // Experience level factor - give variety across levels
    if (job?.experienceLevel) {
      const levelScores = {
        'entry': 15,      // Good for new grads
        'Mid Level': 20,  // High demand segment
        'Senior': 25,     // Valuable positions
        'lead': 20,       // Leadership roles
        'executive': 15   // Specialized audience
      };
      score += levelScores[job.experienceLevel] || 0;
    }
    
    // Job type factor - based on popularity and stability
    if (job?.jobType) {
      const typeScores = {
        'Full Time': 25,   // Most stable
        'Part Time': 15,   // Less commitment
        'contract': 20,    // Good for specialists
        'internship': 10,  // Entry positions
        'remote': 30       // Highly desirable in current market
      };
      score += typeScores[job.jobType] || 0;
    }
    
    // Completeness and quality factors
    
    // Detailed job description
    if (job?.description) {
      // More detailed descriptions get more points (up to 25)
      const descLength = job.description.length;
      score += Math.min(25, Math.floor(descLength / 100));
    }
    
    // Number of requirements listed
    if (job?.requirements && Array.isArray(job.requirements)) {
      // More specific requirements (up to 20 points)
      score += Math.min(20, job.requirements.length * 5);
    }
    
    // Number of perks offered
    if (job?.perks && Array.isArray(job.perks)) {
      // More perks is better (up to 15 points)
      score += Math.min(15, job.perks.length * 3);
    }
    
    // Company quality factors
    if (job?.company) {
      // Company has logo (better brand presence)
      if (job.company.logo) score += 15;
      
      // Company has website (established online presence)
      if (job.company.website) score += 10;
      
      // Company has description
      if (job.company.aboutCompany) score += 10;
    }
    
    // Demand factor - more openings indicates higher demand
    const openings = parseInt(job?.openings) || 0;
    score += Math.min(25, openings * 5); // Cap at 25 points
    
    return score;
  };
  
  // Simulate loading for better UX
  useEffect(() => {
    // Show loading state for at least 300ms to avoid flickering
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [allJobs]);
  
  // Calculate sorted jobs based on different criteria
  const sortedJobs = useMemo(() => {
    if (!allJobs || allJobs.length === 0) return [];
    
    // Create a copy to avoid modifying the original array
    const jobsCopy = [...allJobs];
    
    // Sort based on active tab
    if (activeTab === 'latest') {
      // Sort by creation date (newest first)
      return jobsCopy
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        })
        .slice(0, 6); // Only return the top 6 latest jobs
    } else {
      // Sort by "top" criteria (a combination of salary, openings and other factors)
      return jobsCopy
        .sort((a, b) => {
          // Calculate a "score" for each job based on multiple factors
          const scoreA = calculateJobScore(a);
          const scoreB = calculateJobScore(b);
          return scoreB - scoreA;
        })
        .slice(0, 6); // Only return the top 6 highest scoring jobs
    }
  }, [allJobs, activeTab]);
  
  // Handle view all jobs navigation
  const handleViewAllJobs = () => {
    navigate('/jobs');
  };
  
  // Select tab (latest or top)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Jobs to display are already limited to 6 in the sortedJobs memo
  const jobsToDisplay = sortedJobs || [];
  
  // No remaining jobs since we're only showing 6
  const remainingJobs = 0;

  return (
    <div className='relative max-w-7xl mx-auto px-4 sm:px-6 py-8'>
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-40 right-20 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <motion.div 
        ref={ref}
        initial="hidden"
        animate={controls}
        variants={containerVariants}
        className="relative z-10"
      >
        {/* Header with title and view all button */}
        <motion.div variants={itemVariants} className='text-center mb-8'>
          <h2 className='text-3xl md:text-4xl font-bold'>
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'>Latest & Top </span>
            Job Openings
          </h2>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto mt-4'>Stay updated with the newest job postings from top companies</p>
        </motion.div>

        {/* Tabs and view all button */}
        <motion.div variants={itemVariants} className='flex flex-col sm:flex-row justify-between items-center gap-4 mb-6'>
          <div className='flex items-center bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-md border border-blue-100'>
            <button
              onClick={() => handleTabChange('latest')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'latest' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-700'}`}
            >
              <span className='flex items-center gap-1.5'>
                <Clock className='w-4 h-4' />
                Latest
              </span>
            </button>
            <button
              onClick={() => handleTabChange('top')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'top' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-700'}`}
            >
              <span className='flex items-center gap-1.5'>
                <TrendingUp className='w-4 h-4' />
                Top Rated
              </span>
            </button>
          </div>
          <div className='hidden sm:block'>
            <Button
              onClick={handleViewAllJobs}
              className='bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition-all duration-300 flex items-center gap-2 group shadow-md hover:shadow-lg'
            >
              View All Jobs
              <ArrowRight className='w-4 h-4 transform group-hover:translate-x-1 transition-transform' />
            </Button>
          </div>
        </motion.div>
        
        {/* Job Cards Grid with animations */}
        <AnimatePresence mode='wait'>
          {isLoading ? (
            // Loading skeleton with animation
            <motion.div 
              className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              variants={containerVariants}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div 
                  key={i} 
                  className="p-6 rounded-xl shadow-md bg-white/80 backdrop-blur-sm border border-blue-100 animate-pulse"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  variants={itemVariants}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-blue-200" />
                    <div className="space-y-2">
                      <div className="h-5 w-32 bg-blue-200 rounded" />
                      <div className="h-4 w-24 bg-blue-100 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-5 w-3/4 bg-blue-200 rounded" />
                    <div className="h-4 w-full bg-blue-100 rounded" />
                    <div className="h-4 w-2/3 bg-blue-100 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-24 bg-blue-100 rounded-full" />
                    <div className="h-8 w-24 bg-blue-100 rounded-full" />
                    <div className="h-8 w-24 bg-blue-100 rounded-full" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : jobsToDisplay.length > 0 ? (
            <motion.div 
              className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              variants={containerVariants}
            >
              {jobsToDisplay.map((job, index) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-blue-100 hover:shadow-lg transition-all duration-300"
                >
                  <LatestJobCards 
                    job={job} 
                    isTopJob={activeTab === 'top'}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // No jobs found with animation
            <motion.div 
              className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-blue-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              variants={itemVariants}
            >
              <Briefcase className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Found</h3>
              <p className="text-gray-600">Check back later for new opportunities</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile view all button */}
        <motion.div 
          variants={itemVariants}
          className="mt-6 text-center sm:hidden"
        >
          <Button 
            onClick={handleViewAllJobs}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full px-6 py-3 rounded-full transition-all duration-300 flex items-center justify-center gap-2 group shadow-md hover:shadow-lg"
          >
            View All Jobs
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LatestJobs;
