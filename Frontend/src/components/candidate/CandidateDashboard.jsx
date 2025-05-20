import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { setCandidateApplications, setSavedJobs, setInterviewProgress } from '@/Redux/ApplicationSlice';
import axios from 'axios';

const CandidateDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { candidateApplications = [], savedJobs = [], interviewProgress } = useSelector(state => state.application);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch applications
        const applicationsRes = await axios.get(`/api/applications/candidate/${user._id}`);
        const applications = Array.isArray(applicationsRes.data?.application) ? applicationsRes.data.application : [];
        dispatch(setCandidateApplications(applications));

        // Fetch saved jobs
        const savedJobsRes = await axios.get(`/api/jobs/saved/${user._id}`);
        const savedJobsData = Array.isArray(savedJobsRes.data?.jobs) ? savedJobsRes.data.jobs : [];
        dispatch(setSavedJobs(savedJobsData));

        // Fetch interview progress
        const progressRes = await axios.get(`/api/applications/progress/${user._id}`);
        dispatch(setInterviewProgress(progressRes.data));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [dispatch, user._id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTakeAptitudeTest = (applicationId) => {
    navigate(`/aptitude-test/${applicationId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Candidate Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Applications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4">My Applications</h2>
          <div className="space-y-4">
            {Array.isArray(candidateApplications) && candidateApplications.length > 0 ? (
              candidateApplications.map((application) => (
                <div key={application._id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{application?.job?.title || 'Untitled Job'}</h3>
                  <p className="text-sm text-gray-600">{application?.job?.company?.name || 'Company Not Specified'}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-sm mt-2 ${getStatusColor(application?.status)}`}>
                    {application?.status || 'pending'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">
                No applications found
              </div>
            )}
          </div>
        </motion.div>

        {/* Interview Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Interview Progress</h2>
          {interviewProgress?.interviewProgress?.length > 0 ? (
            <div className="space-y-4">
              {interviewProgress.interviewProgress.map((round, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{round.roundName}</h3>
                      <p className="text-sm text-gray-600">Round {round.round}</p>
                    </div>
                    <span className={`inline-block px-2 py-1 rounded-full text-sm ${getStatusColor(round.status)}`}>
                      {round.status}
                    </span>
                  </div>
                  {round.roundType === 'aptitude' && 
                   round.status === 'in_progress' && 
                   !round.aptitudeTestGiven && (
                    <button
                      onClick={() => handleTakeAptitudeTest(interviewProgress?._id)}
                      className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      Take Aptitude Test
                    </button>
                  )}
                  {round.score > 0 && (
                    <p className="mt-2 text-sm">Score: {round.score}%</p>
                  )}
                  {round.feedback && (
                    <p className="mt-2 text-sm italic">{round.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No active interview process</p>
          )}
        </motion.div>

        {/* Saved Jobs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-1 bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Saved Jobs</h2>
          <div className="space-y-4">
            {Array.isArray(savedJobs) && savedJobs.length > 0 ? (
              savedJobs.map((job) => (
                <div key={job?._id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{job?.title || 'Untitled Position'}</h3>
                  <p className="text-sm text-gray-600">{job?.company?.name || 'Company Not Specified'}</p>
                  <p className="text-sm text-gray-600">₹{(job?.salary || 0).toLocaleString()}/year</p>
                  <button
                    onClick={() => navigate(`/job/${job?._id}`)}
                    className="mt-2 text-blue-500 hover:text-blue-600"
                  >
                    View Details
                  </button>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">
                No saved jobs found
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
