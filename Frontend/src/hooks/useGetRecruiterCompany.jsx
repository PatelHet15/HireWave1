import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { COMPANY_API_END_POINT } from '@/utils/constant';
import { setSingleCompany } from '@/Redux/companySlice';
import { setUser } from '@/Redux/authSlice';

/**
 * Hook to fetch the recruiter's company
 * This will be called when a recruiter logs in to load their company data
 */
const useGetRecruiterCompany = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const fetchedRef = useRef(false);
  
  useEffect(() => {
    // Prevent multiple fetches for the same user
    if (fetchedRef.current || !user || user.role !== 'recruiter') return;

    const fetchRecruiterCompany = async () => {
      try {
        fetchedRef.current = true;
        
        const res = await axios.get(`${COMPANY_API_END_POINT}/recruiter-company`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') && {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            })
          }
        });
        
        if (res.data.success && res.data.company) {
          // Update the company in the Redux store
          dispatch(setSingleCompany(res.data.company));
          
          // Only update user profile if company info is not already there
          // to prevent update loops
          if (!user.profile?.company || user.profile.company._id !== res.data.company._id) {
            const updatedUser = {
              ...user,
              profile: {
                ...user.profile,
                company: res.data.company
              }
            };
            
            dispatch(setUser(updatedUser));
          }
        }
      } catch (error) {
        console.error("Error fetching recruiter's company:", error);
        
        // If it's a 404, it means the recruiter doesn't have a company yet
        if (error.response?.status === 404) {
          // Set hasCompany to false to prompt the UI to show the company creation flow
          dispatch(setSingleCompany(null));
        } else {
          // For other errors, log them but don't disrupt the user experience
          console.error("Error details:", error.response?.data?.message || "Unknown error");
        }
      }
    };
    
    fetchRecruiterCompany();
    
    // Cleanup function
    return () => {
      fetchedRef.current = false;
    };
  }, [dispatch, user?.id]); // Only re-run if the user ID changes, not on every user state change
};

export default useGetRecruiterCompany; 