import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { CANDIDATE_API_END_POINT } from '@/utils/constant';

const useGetCandidateById = (candidateId) => {
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState(null);

  const fetchCandidate = async () => {
    if (!candidateId) {
      setLoading(false);
      setError('Candidate ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.get(`${CANDIDATE_API_END_POINT}/${candidateId}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setCandidate(response.data.candidate);
      } else {
        throw new Error(response.data.message || 'Failed to fetch candidate data');
      }
    } catch (err) {
      console.error('Error fetching candidate:', err);
      const errorMessage = err.response?.data?.message ||
        err.message ||
        'Error fetching candidate data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, [candidateId]);

  const refetch = () => {
    fetchCandidate();
  };

  return { loading, candidate, error, refetch };
};

export default useGetCandidateById;