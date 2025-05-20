import { createSlice } from "@reduxjs/toolkit";

const applicationSlice = createSlice({
  name: "application",
  initialState: {
    interviewTemplates: [],
    currentTemplate: null,
    savedJobs: [],
    candidateApplications: [],
    interviewProgress: null
  }, 
  reducers: {
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
        }
  },
});

export const { 
  setInterviewTemplates,
  setCurrentTemplate,
  setSavedJobs,
  setCandidateApplications,
  setInterviewProgress
} = applicationSlice.actions;

export default applicationSlice.reducer;