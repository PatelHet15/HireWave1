import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { APPLICATION_API_END_POINT } from "@/utils/constant";
import { setAllAppliedJobs } from "@/Redux/jobSlice";

const useGetAppliedJobs = () => {
  const dispatch = useDispatch();

  const fetchAppliedJobs = async () => {
    // Add timestamp to make debugging easier
    const requestTime = new Date().toISOString();
    console.log(`[${requestTime}] Starting to fetch applied jobs...`);
    
    try {
      // Use the correct endpoint
      console.log(`[${requestTime}] Fetching from: ${APPLICATION_API_END_POINT}/my-applications`);
      
      // Get token from localStorage for authentication
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error(`[${requestTime}] No authentication token found in localStorage`);
        dispatch(setAllAppliedJobs([]));
        return;
      }
      
      const res = await axios.get(`${APPLICATION_API_END_POINT}/my-applications`, { 
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}` // Make sure this matches your backend authentication method
        }
      });
      
      console.log(`[${requestTime}] Applied jobs response:`, res.data);
      
      if (res.data.success) {
        // Check both possible keys where data might be returned
        const applications = res.data.applications || res.data.application || [];
        console.log(`[${requestTime}] Found ${applications.length} applications`, applications);
        dispatch(setAllAppliedJobs(applications));
      } else {
        console.error(`[${requestTime}] Failed to fetch applied jobs:`, res.data.message);
        dispatch(setAllAppliedJobs([]));
      }
    } catch (error) {
      console.error(`[${requestTime}] Error fetching applied jobs:`, error.message);
      console.error(`[${requestTime}] Full error:`, error);
      
      // Clear applications on error
      dispatch(setAllAppliedJobs([]));
    }
  };

  useEffect(() => {
    fetchAppliedJobs();
  }, []);

  return fetchAppliedJobs;
};

export default useGetAppliedJobs;
