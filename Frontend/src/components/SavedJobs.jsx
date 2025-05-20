import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from './shared/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Briefcase, 
  BookmarkX, 
  Search, 
  X, 
  ArrowUpDown, 
  SlidersHorizontal,
  SortAsc,
  SortDesc,
  Calendar,
  RefreshCw
} from 'lucide-react';

// Import constants
import { USER_API_END_POINT, JOB_API_END_POINT } from '@/utils/constant';

// Lazy load the Job component
const Job = lazy(() => import('./Job'));

// Loading fallback
const JobSkeleton = () => (
  <div className="p-6 border bg-white rounded-xl shadow-md w-full animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-slate-200 rounded-xl"></div>
        <div>
          <div className="h-5 w-32 bg-slate-200 rounded mb-2"></div>
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
      <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
    </div>
    <div className="h-6 w-3/4 bg-slate-200 rounded mb-3"></div>
    <div className="h-4 w-full bg-slate-200 rounded mb-4"></div>
    <div className="flex gap-4 mb-4">
      <div className="h-5 w-20 bg-slate-200 rounded"></div>
      <div className="h-5 w-20 bg-slate-200 rounded"></div>
      <div className="h-5 w-20 bg-slate-200 rounded"></div>
    </div>
    <div className="flex gap-4 mb-3">
      <div className="h-10 w-full bg-slate-200 rounded"></div>
      <div className="h-10 w-full bg-blue-200 rounded"></div>
    </div>
    <div className="h-4 w-24 bg-slate-200 rounded ml-auto"></div>
  </div>
);

const SavedJobs = () => {
  // State for saved jobs
  const [savedJobs, setSavedJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'salary-high', 'salary-low'
  const [refreshing, setRefreshing] = useState(false);
  
  // Get user from Redux store
  const { user } = useSelector((state) => state.auth);

  // Mock saved jobs cache
  const [jobsCache, setJobsCache] = useState(() => {
    try {
      // Try to load cached jobs from localStorage
      const cached = localStorage.getItem('jobsCache');
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error("Error loading jobs cache from localStorage", error);
      return {};
    }
  });
  
  // Save jobs cache to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('jobsCache', JSON.stringify(jobsCache));
    } catch (error) {
      console.error("Error saving jobs cache to localStorage", error);
    }
  }, [jobsCache]);
  
  // Fetch saved jobs on component mount
  useEffect(() => {
    fetchSavedJobs();
  }, []);
  
  // Filter jobs based on search term
  useEffect(() => {
    if (!savedJobs.length) {
      setFilteredJobs([]);
      return;
    }
    
    let filtered = [...savedJobs];
    
    // Apply search term filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job => {
        return (
          (job.title && job.title.toLowerCase().includes(term)) || 
          (job.company?.name && job.company.name.toLowerCase().includes(term)) || 
          (job.jobLocation && job.jobLocation.toLowerCase().includes(term)) || 
          (job.jobType && job.jobType.toLowerCase().includes(term)) ||
          (job.description && job.description.toLowerCase().includes(term))
        );
      });
    }
    
    // Apply sorting
    filtered = sortJobs(filtered, sortOrder);
    
    setFilteredJobs(filtered);
  }, [searchTerm, savedJobs, sortOrder]);
  
  // Fetch job details from the API using job ID
  const fetchJobDetails = async (jobId) => {
    try {
      const response = await axios.get(`${JOB_API_END_POINT}/${jobId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success && response.data.job) {
        // Update the cache with this job
        setJobsCache(prev => ({
          ...prev,
          [jobId]: response.data.job
        }));
        return response.data.job;
      }
    } catch (error) {
      console.log(`Failed to fetch job details for ID: ${jobId}`);
    }
    return null;
  };
  
  // Fetch all jobs for popular listings (fallback)
  const fetchAllJobs = async () => {
    try {
      const response = await axios.get(`${JOB_API_END_POINT}s`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success && response.data.jobs) {
        // Update the cache with all jobs
        const updatedCache = { ...jobsCache };
        response.data.jobs.forEach(job => {
          if (job && job._id) {
            updatedCache[job._id] = job;
          }
        });
        setJobsCache(updatedCache);
        return response.data.jobs;
      }
    } catch (error) {
      console.log('Failed to fetch all jobs');
    }
    return null;
  };
  
  // Fetch saved jobs from the server
  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      
      try {
        // Try actual API first
        const response = await axios.get(`${USER_API_END_POINT}/user/saved-jobs`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          const jobs = response.data.savedJobs || [];
          setSavedJobs(jobs);
          setFilteredJobs(sortJobs(jobs, sortOrder));
        } else {
          toast.error(response.data.message || 'Failed to fetch saved jobs');
        }
      } catch (error) {
        console.log('Using mock saved jobs as backend is not available');
        
        // If API fails, use mock implementation from localStorage
        try {
          // Get job IDs from localStorage
          const mockSavedJobIds = JSON.parse(localStorage.getItem('mockSavedJobs') || '[]');
          
          if (mockSavedJobIds.length === 0) {
            setSavedJobs([]);
            setFilteredJobs([]);
            return;
          }
          
          // Prepare promises array to load all job details
          const jobPromises = mockSavedJobIds.map(async (jobId) => {
            // First check if job is in cache
            if (jobsCache[jobId]) {
              return jobsCache[jobId];
            }
            
            // If not in cache, try to fetch it
            return await fetchJobDetails(jobId);
          });
          
          // Wait for all job details to be fetched
          const jobResults = await Promise.all(jobPromises);
          
          // Filter out null values (failed fetches)
          const validJobs = jobResults.filter(job => job !== null);
          
          if (validJobs.length > 0) {
            setSavedJobs(validJobs);
            setFilteredJobs(sortJobs(validJobs, sortOrder));
            
            // Show message if some jobs couldn't be loaded
            if (validJobs.length < mockSavedJobIds.length) {
              toast.info(`${mockSavedJobIds.length - validJobs.length} saved jobs couldn't be loaded. Click "Refresh Jobs" to try again.`);
            }
          } else {
            // If no jobs could be loaded, try fetching all jobs as a fallback
            const allJobs = await fetchAllJobs();
            
            if (allJobs) {
              const matchingJobs = allJobs.filter(job => 
                job && job._id && mockSavedJobIds.includes(job._id)
              );
              
              if (matchingJobs.length > 0) {
                setSavedJobs(matchingJobs);
                setFilteredJobs(sortJobs(matchingJobs, sortOrder));
                
                if (matchingJobs.length < mockSavedJobIds.length) {
                  toast.info(`${mockSavedJobIds.length - matchingJobs.length} saved jobs couldn't be loaded.`);
                }
              } else {
                setSavedJobs([]);
                setFilteredJobs([]);
                toast.info('No saved jobs could be loaded. Try browsing jobs and bookmarking them again.');
              }
            } else {
              setSavedJobs([]);
              setFilteredJobs([]);
              toast.info('No saved jobs could be loaded. Try browsing jobs and bookmarking them again.');
            }
          }
        } catch (localError) {
          console.error('Error parsing mock saved jobs:', localError);
          toast.error('Failed to load your saved jobs');
          setSavedJobs([]);
          setFilteredJobs([]);
        }
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      toast.error('Failed to load your saved jobs');
      setSavedJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchSavedJobs();
  };
  
  // Remove a job from saved jobs
  const handleRemoveJob = async (jobId) => {
    try {
      try {
        // Try actual API first
        const response = await axios.delete(`${USER_API_END_POINT}/user/saved-jobs/${jobId}`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          // Update local state
          setSavedJobs(prev => prev.filter(job => job._id !== jobId));
          toast.success('Job removed from saved list');
        } else {
          toast.error(response.data.message || 'Failed to remove job');
        }
      } catch (error) {
        console.log('Using mock saved jobs as backend is not available');
        
        // If API fails, update localStorage directly
        try {
          const mockSavedJobIds = JSON.parse(localStorage.getItem('mockSavedJobs') || '[]');
          const updatedSavedJobs = mockSavedJobIds.filter(id => id !== jobId);
          localStorage.setItem('mockSavedJobs', JSON.stringify(updatedSavedJobs));
          
          // Update local state
          setSavedJobs(prev => prev.filter(job => job._id !== jobId));
          toast.success('Job removed from saved list');
        } catch (localError) {
          console.error('Error updating mock saved jobs:', localError);
          toast.error('Failed to remove job from saved list');
        }
      }
    } catch (error) {
      console.error('Error removing saved job:', error);
      toast.error('Failed to remove job from saved list');
    }
  };
  
  // Handle clearing all saved jobs
  const handleClearAllSavedJobs = () => {
    try {
      localStorage.setItem('mockSavedJobs', JSON.stringify([]));
      setSavedJobs([]);
      setFilteredJobs([]);
      toast.success('All saved jobs cleared');
    } catch (error) {
      console.error('Error clearing saved jobs:', error);
      toast.error('Failed to clear saved jobs');
    }
  };
  
  // Sort jobs based on the selected order
  const sortJobs = (jobs, order) => {
    if (!jobs || !jobs.length) return [];
    
    const sorted = [...jobs];
    
    switch (order) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'salary-high':
        return sorted.sort((a, b) => parseFloat(b.salary || 0) - parseFloat(a.salary || 0));
      case 'salary-low':
        return sorted.sort((a, b) => parseFloat(a.salary || 0) - parseFloat(b.salary || 0));
      default:
        return sorted;
    }
  };
  
  // Handle sort order change
  const handleSortChange = (order) => {
    setSortOrder(order);
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  // Calculate time since job was saved (placeholder - would need saved timestamp)
  const getTimeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return "Just now";
  };

  // Cache job data when viewing jobs
  useEffect(() => {
    // Listen for a custom event that could be fired from the Job component
    const handleJobView = (event) => {
      const job = event.detail;
      if (job && job._id) {
        setJobsCache(prev => ({
          ...prev,
          [job._id]: job
        }));
      }
    };
    
    window.addEventListener('jobView', handleJobView);
    
    return () => {
      window.removeEventListener('jobView', handleJobView);
    };
  }, []);
  
  // Add job to cache when viewing from this component
  useEffect(() => {
    if (savedJobs.length > 0) {
      const newCache = { ...jobsCache };
      let updated = false;
      
      savedJobs.forEach(job => {
        if (job && job._id && !newCache[job._id]) {
          newCache[job._id] = job;
          updated = true;
        }
      });
      
      if (updated) {
        setJobsCache(newCache);
      }
    }
  }, [savedJobs]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Jobs</h1>
          <p className="text-gray-500">Review and manage the jobs you've bookmarked for later</p>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search in your saved jobs..."
              className="pl-10 py-2 text-base rounded-lg shadow-sm border-gray-200 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 mr-4">
              <SlidersHorizontal className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
            </div>
            
            <Badge
              onClick={() => handleSortChange('newest')}
              className={`cursor-pointer flex items-center gap-1 ${
                sortOrder === 'newest' 
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="h-3 w-3" />
              Newest
            </Badge>
            
            <Badge
              onClick={() => handleSortChange('oldest')}
              className={`cursor-pointer flex items-center gap-1 ${
                sortOrder === 'oldest' 
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="h-3 w-3" />
              Oldest
            </Badge>
            
            <Badge
              onClick={() => handleSortChange('salary-high')}
              className={`cursor-pointer flex items-center gap-1 ${
                sortOrder === 'salary-high' 
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SortDesc className="h-3 w-3" />
              Salary: High to Low
            </Badge>
            
            <Badge
              onClick={() => handleSortChange('salary-low')}
              className={`cursor-pointer flex items-center gap-1 ${
                sortOrder === 'salary-low' 
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SortAsc className="h-3 w-3" />
              Salary: Low to High
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="ml-auto bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Jobs
            </Button>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-blue-500" />
                Your Saved Positions
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Found {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
                {searchTerm && <> matching "<span className="font-medium">{searchTerm}</span>"</>}
              </p>
            </div>
            
            {savedJobs.length > 0 && (
              <Button 
                variant="outline" 
                className="flex items-center gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100"
                onClick={handleClearAllSavedJobs}
              >
                <BookmarkX className="h-4 w-4" />
                <span className="hidden sm:inline">Clear All</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Job Listings */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((i) => (
              <JobSkeleton key={i} />
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-6"
            >
              {filteredJobs.map((job, index) => (
                <motion.div 
                  key={job?._id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative"
                >
                  <div className="absolute right-4 top-4 z-20">
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-red-50 border-red-100 hover:bg-red-100 text-red-500 h-8 w-8 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveJob(job._id);
                      }}
                    >
                      <BookmarkX className="h-4 w-4" />
                    </Button>
                  </div>
                  <Suspense fallback={<JobSkeleton />}>
                    <Job job={job} variant="list" className="no-hover" />
                  </Suspense>
                  <div className="w-full text-right text-xs text-gray-500 mt-1">
                    Saved {getTimeSince(job.updatedAt || job.createdAt)}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-100 p-3 rounded-full mb-4">
                <Briefcase className="h-8 w-8 text-gray-400" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-700 mb-2">No saved jobs yet</CardTitle>
              <CardDescription className="text-center max-w-md mb-6">
                When you're browsing jobs, click the bookmark icon to save positions you're interested in for later review.
              </CardDescription>
              <Button 
                onClick={() => window.location.href = '/jobs'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Browse Available Jobs
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SavedJobs; 