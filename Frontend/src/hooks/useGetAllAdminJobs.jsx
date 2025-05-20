import { setAllAdminJobs } from '@/Redux/jobSlice';
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios';
import { JOB_API_END_POINT } from '@/utils/constant';

const useGetAllAdminJobs = () => {
  const dispatch = useDispatch();
    useEffect(() => {
      const fetchAllAdminJobs = async () => {
        try {
          const res = await axios.get(`${JOB_API_END_POINT}/getadminjobs`, {
            headers: {
              ...(localStorage.getItem('token') && {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              })
            }
          });
          if (res.data.success) {
            dispatch(setAllAdminJobs(res.data.jobs));
          } 
        } catch (error) {
          console.log(error);
        }
      }
      fetchAllAdminJobs();
    },[])
}

export default useGetAllAdminJobs;
