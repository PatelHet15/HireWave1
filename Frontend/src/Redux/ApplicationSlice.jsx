import { createSlice } from "@reduxjs/toolkit";
const applicationSlice = createSlice({
  name: "application",
  initialState: {
    applicants: [],
    interviewTemplates: [],
    currentTemplate: null,
    savedJobs: [],
    candidateApplications: [],
    interviewProgress: null
  }, 
  reducers: {
    setAllApplicants: (state, action) => {
      state.applicants = action.payload;
    },
    setInterviewTemplates: (state, action) => {
      state.interviewTemplates = Array.isArray(action.payload) ? action.payload : [];
    },
    setCurrentTemplate: (state, action) => {
      state.currentTemplate = action.payload;
    },
    setSavedJobs: (state, action) => {
      state.savedJobs = action.payload;
    },
    setCandidateApplications: (state, action) => {
      state.candidateApplications = Array.isArray(action.payload) ? action.payload : [];
    },
    setInterviewProgress: (state, action) => {
      state.interviewProgress = action.payload;
    },
    updateApplicantStatus: (state, action) => {
      const { applicantId, status, currentRound, roundProgress } = action.payload;
      const applicant = state.applicants.find(app => app._id === applicantId);
      if (applicant) {
        applicant.status = status;
        applicant.currentRound = currentRound;
        if (roundProgress) {
          applicant.interviewProgress = [
            ...applicant.interviewProgress || [],
            roundProgress
          ];
        }
      }
    }
  },
})

export const { 
  setAllApplicants,
  setInterviewTemplates,
  setCurrentTemplate,
  setSavedJobs,
  setCandidateApplications,
  setInterviewProgress,
  updateApplicantStatus
} = applicationSlice.actions;

export default applicationSlice.reducer;