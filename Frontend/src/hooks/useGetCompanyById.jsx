import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios';
import { COMPANY_API_END_POINT } from '@/utils/constant';
import { setSingleCompany } from '@/Redux/companySlice';
import { toast } from 'sonner';
import { setUser } from '@/Redux/authSlice';

const useGetCompanyByID = (companyID) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  // Use a ref to track if we've already fetched data for this component instance
  const hasDataBeenFetched = useRef(false);
  
  useEffect(() => {
    const fetchSingleCompany = async () => {
      // Don't try to fetch if there's no company ID or if we've already fetched data
      if (!companyID || hasDataBeenFetched.current) return;
      
      try {
        // Set the flag to true to prevent additional fetches
        hasDataBeenFetched.current = true;
        
        // Add timestamp to prevent caching and ensure fresh data
        const timestamp = new Date().getTime();
        const res = await axios.get(`${COMPANY_API_END_POINT}/get/${companyID}?_t=${timestamp}`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            // Include any auth tokens from localStorage if your backend uses them
            ...(localStorage.getItem('token') && {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            })
          }
        });
        
        if (res.data.success) {
          dispatch(setSingleCompany(res.data.company));
          
          // If user is a recruiter, update the user's profile with the company information
          if (user?.role === 'recruiter') {
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
        console.error("Error fetching company data:", error);
        
        // Handle specific error cases
        if (error.response?.status === 404) {
          // Company not found - redirect to company creation
          dispatch(setSingleCompany(null));
          toast.error("Company not found. Please create a company first.");
        } else if (error.response?.status === 403) {
          toast.error("You don't have permission to view this company");
        } else {
          // Generic error handling for other cases
          toast.error("Failed to load company information. Please try again later.");
        }
      }
    };
    
    if (companyID) {
      fetchSingleCompany();
    }
  }, [companyID, dispatch, user]);
};

export default useGetCompanyByID;
