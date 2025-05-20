import { setAllJobs } from '@/Redux/jobSlice';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { JOB_API_END_POINT } from '@/utils/constant';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const useGetAllJobs = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { searchedQuery } = useSelector((store) => store.job);
  const { user } = useSelector((store) => store.auth);

  useEffect(() => {
    const fetchAllJobs = async () => {
      try {
        // Check if user is logged in
        const isAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/signup');
        const token = localStorage.getItem('token');
        
        if (!user?._id && !isAuthPage) {
          // For specific pages like profile, show login message
          const authRequiredPages = ['/profile', '/settings'];
          if (authRequiredPages.some(page => window.location.pathname.includes(page))) {
            console.warn("User not authenticated, redirecting to login");
            toast.error("Please login to continue");
            navigate('/login');
            return;
          }
        }

        // Don't make the API call if we're on auth pages or if there's no token
        if (isAuthPage || (!token && !user?._id)) {
          return;
        }

        // Properly format and encode the search query
        const keyword = searchedQuery ? encodeURIComponent(searchedQuery.trim()) : '';
        
        // Build the URL with the keyword parameter
        const url = `${JOB_API_END_POINT}/get${keyword ? `?keyword=${keyword}` : ''}`;
        
        const res = await axios.get(url, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            ...(token && {
              'Authorization': `Bearer ${token}`
            })
          }
        });
        
        if (res.data.success) {
          // Ensure all jobs have complete data to prevent UI errors
          const jobsWithCompanyData = res.data.jobs.map((job) => ({
            ...job,
            // Ensure company details exist
            company: job.company ? {
              name: job.company.name || "Unknown Company",
              logo: job.company.logo || "./src/assets/logo.png",
              location: job.company.location || "N/A",
              jobLocation: job.company.jobLocation || job.company.location || "N/A",
              ...job.company,
            } : { 
              name: "Unknown Company", 
              logo: "./src/assets/logo.png", 
              jobLocation: "N/A",
              location: "N/A" 
            },
            // Ensure job details exist
            title: job.title || "Untitled Position",
            position: job.position || "",
            jobType: job.jobType || "Not specified",
            jobLocation: job.jobLocation || job.company?.location || "N/A",
            salary: job.salary || "Not specified"
          }));
          
          dispatch(setAllJobs(jobsWithCompanyData));
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        
        // Handle authentication errors
        if (error.response?.status === 401) {
          // Only show the toast message on pages that directly depend on authentication
          const nonAuthPages = ['/', '/browse', '/jobs', '/recommended-jobs', '/jobs-near-you'];
          const currentPath = window.location.pathname;
          const isNonAuthPage = nonAuthPages.some(path => 
            path === currentPath || (path !== '/' && currentPath.startsWith(path))
          );
          
          if (!isNonAuthPage) {
            toast.error("Your session has expired. Please login again");
            // Clear any stored credentials
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }
        } else {
          // Only show error toast on direct job pages, not on recommendation pages
          if (window.location.pathname === '/browse' || window.location.pathname === '/jobs') {
            toast.error("Failed to load jobs. Please try again later");
          }
        }
        
        // Set empty array in case of error to prevent rendering with stale data
        dispatch(setAllJobs([]));
      }
    };

    fetchAllJobs();
  }, [searchedQuery, dispatch, user, navigate, location.pathname]);
};

export default useGetAllJobs;
