import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import interviewPipelineRoutes from "./routes/interviewPipeline.route.js";
import candidateRoute from "./routes/candidate.route.js";
import resumeAnalysisRoute from "./routes/resumeAnalysis.route.js";
import analyticsRoute from "./routes/analytics.route.js";

dotenv.config({});

const app = express();

//middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

// CORS configuration based on environment
const isProduction = process.env.NODE_ENV === 'production';
const corsOptions = {
  origin: isProduction 
    ? [
        'https://hire-wave1-8245.vercel.app',
        'https://hire-wave1.vercel.app',
        'https://hire-wave1-hmca-git-main-patelhetis-projects.vercel.app',
        'https://hire-wave1-hmca-eswmwnkic-patelhetis-projects.vercel.app',
        process.env.FRONTEND_URL  // Get from environment variable if set
      ].filter(Boolean) // Filter out any undefined/null values
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
};

app.use(cors(corsOptions));

const PORT = process.env.PORT || 3000;

app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1/pipeline", interviewPipelineRoutes);
app.use("/api/v1/candidate", candidateRoute);
app.use("/api/v1/resume", resumeAnalysisRoute);
app.use("/api/v1/analytics", analyticsRoute);

app.listen(PORT, ()=>{
  connectDB();
  console.log(`Server is running at port no. ${PORT}`);
})

