import { createSlice } from "@reduxjs/toolkit";

const jobSlice = createSlice({
  name: "job",
  initialState: {
    allJobs: [],
    allAdminJobs: [],
    singleJob: null,
    searchJobByText: "",
    allAppliedJobs: [],
    searchedQuery: "",
    similarJobs: [], 
    applicationStatus: {} // { jobId: boolean }
  },
  reducers: {
    setAllJobs: (state, action) => {
      state.allJobs = action.payload || []; 
    },
    setSingleJob: (state, action) => {
      state.singleJob = action.payload || null;
    },
    setAllAdminJobs: (state, action) => {
      state.allAdminJobs = action.payload || [];
    },
    setSearchJobByText: (state, action) => {
      state.searchJobByText = action.payload || "";
    },
    setAllAppliedJobs: (state, action) => {
      console.log("Setting applied jobs in Redux:", action.payload);
      
      // Handle various formats the API might return
      let jobs = [];
      
      if (Array.isArray(action.payload)) {
        // If the payload is already an array, use it directly
        jobs = action.payload;
      } else if (action.payload && typeof action.payload === 'object') {
        // If the payload is an object, check for known keys
        if (Array.isArray(action.payload.applications)) {
          jobs = action.payload.applications;
        } else if (Array.isArray(action.payload.application)) {
          jobs = action.payload.application;
        }
      }
      
      // Log the number of jobs found for debugging
      console.log(`Processed ${jobs.length} applied jobs`);
      
      // Update the state with the processed array
      state.allAppliedJobs = jobs;
    },
    setSearchedQuery: (state, action) => {
      state.searchedQuery = action.payload || "";
    },
    updateJobDetails: (state, action) => {
      if (state.singleJob) {
        state.singleJob = {
          ...state.singleJob,
          ...action.payload, 
        };
      }
    },
    setSimilarJobs: (state, action) => {
      state.similarJobs = Array.isArray(action.payload) ? action.payload : [];
    },
    setApplicationStatus: (state, action) => {
      state.applicationStatus[action.payload.jobId] = action.payload.status;
    }
  },
});

export const { 
  setAllJobs, setSingleJob, setAllAdminJobs, 
  setSearchJobByText, setAllAppliedJobs, 
  setSearchedQuery, updateJobDetails, 
  setSimilarJobs, setApplicationStatus
} = jobSlice.actions;

export default jobSlice.reducer;
