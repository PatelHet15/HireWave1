import { createSlice } from "@reduxjs/toolkit";

// Helper function to ensure valid company data
const processCompanyData = (company) => {
  if (!company) return null;
  
  // Handle potentially invalid logo URLs
  const logoUrl = company.logo;
  if (!logoUrl || logoUrl === "undefined" || logoUrl === "null") {
    company.logo = "/src/assets/logo.png"; // Default logo
  }
  
  return company;
};

// Helper to check if two companies are equal to avoid unnecessary updates
const areCompaniesEqual = (company1, company2) => {
  if (!company1 && !company2) return true;
  if (!company1 || !company2) return false;
  
  return company1._id === company2._id;
};

const companySlice = createSlice({
  name: "company",
  initialState: {
    recruiterCompany: null, // Single company for the recruiter
    companies: [],
    searchCompanyByText: "",
    hasCompany: false, // Flag to track if recruiter has already created a company
  },
  reducers: {
    setSingleCompany: (state, action) => {
      // If we explicitly set the company to null, handle that case
      if (action.payload === null) {
        if (state.recruiterCompany === null) return; // No change needed
        state.recruiterCompany = null;
        state.hasCompany = false;
        return;
      }

      // Always update the company data to ensure fresh data is displayed
      // This ensures that any changes to fields like location are always reflected
      state.recruiterCompany = processCompanyData(action.payload);
      state.hasCompany = !!action.payload; // Explicitly set based on payload
    },
    setCompanies: (state, action) => {
      state.companies = Array.isArray(action.payload) ? action.payload : [];
    },
    setSearchCompanyByText: (state, action) => {
      state.searchCompanyByText = action.payload;
    },
    clearCompanyData: (state) => {
      state.recruiterCompany = null;
      state.hasCompany = false;
    },
    updateCompanyDetails: (state, action) => {
      if (state.recruiterCompany) {
        state.recruiterCompany = processCompanyData({
          ...state.recruiterCompany,
          ...action.payload,
        });
      }
    },
  },
});

export const { 
  setSingleCompany, 
  setCompanies, 
  setSearchCompanyByText, 
  clearCompanyData,
  updateCompanyDetails
} = companySlice.actions;

export default companySlice.reducer;
