import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios';
import { COMPANY_API_END_POINT } from '@/utils/constant';
import { setCompanies } from '@/Redux/companySlice';

const useGetAllCompanies = () => {
  const dispatch = useDispatch();
    useEffect(() => {
      const fetchCompanies = async () => {
        try {
          const res = await axios.get(`${COMPANY_API_END_POINT}/get`, {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              // Include auth token from localStorage if available
              ...(localStorage.getItem('token') && {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              })
            }
          });
          
          if (res.data.success) {
            dispatch(setCompanies(res.data.companies));
          } 
        } catch (error) {
          console.log(error);
          // Don't show error for auth issues as this might be a public page
          if (error.response?.status !== 401) {
            console.error("Error fetching companies:", error);
          }
        }
      }
      fetchCompanies();
    },[])
}

export default useGetAllCompanies;
