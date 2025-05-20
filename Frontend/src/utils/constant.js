// Get base API URL from environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const USER_API_END_POINT = `${API_BASE_URL}/api/v1/user`;
export const JOB_API_END_POINT = `${API_BASE_URL}/api/v1/job`;
export const APPLICATION_API_END_POINT = `${API_BASE_URL}/api/v1/application`;
export const COMPANY_API_END_POINT = `${API_BASE_URL}/api/v1/company`;
export const PIPELINE_API_END_POINT = `${API_BASE_URL}/api/v1/pipeline`;
export const CANDIDATE_API_END_POINT = `${API_BASE_URL}/api/v1/candidate`;
export const APTITUDE_TEST_API_END_POINT = `${API_BASE_URL}/api/v1/aptitude-test`;
export const RESUME_API_END_POINT = `${API_BASE_URL}/api/v1/resume`;
export const ANALYTICS_API_END_POINT = `${API_BASE_URL}/api/v1/analytics`;
