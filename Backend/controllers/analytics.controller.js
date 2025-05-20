import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { JobView, ApplyClick } from "../models/analytics.model.js";
import mongoose from "mongoose";

const getRecruiterAnalytics = async (req, res) => {
  try {
  const { timeRange = "30days" } = req.query;

  // Calculate date range based on timeRange parameter
  const currentDate = new Date();
  let startDate = new Date();
  
  switch (timeRange) {
    case "7days":
      startDate.setDate(currentDate.getDate() - 7);
      break;
    case "30days":
      startDate.setDate(currentDate.getDate() - 30);
      break;
    case "90days":
      startDate.setDate(currentDate.getDate() - 90);
      break;
    case "year":
      startDate.setDate(currentDate.getDate() - 365);
      break;
    default:
      startDate.setDate(currentDate.getDate() - 30);
  }

  // Calculate total job views across all jobs in the system
  const totalJobViews = await JobView.countDocuments({
    createdAt: { $gte: startDate }
  });
  
  console.log('Total job views count:', totalJobViews);
  
  // Calculate total applications (apply clicks) across all jobs
  const totalApplications = await ApplyClick.countDocuments({
    createdAt: { $gte: startDate }
  });
  
  console.log('Total applications count:', totalApplications);

  // Calculate conversion rate (applications / job views)
  const conversionRate = totalJobViews > 0 
    ? ((totalApplications / totalJobViews) * 100).toFixed(1) 
    : 0;

  // Get total active jobs count (all jobs with future apply-by date)
  const totalActiveJobs = await Job.countDocuments({ 
    applyBy: { $gt: new Date() }
  });

  // Get applications data for chart (weekly) - using ApplyClick for consistency
  const applicationsData = await ApplyClick.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          week: { $week: "$createdAt" },
          year: { $year: "$createdAt" }
        },
        applications: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.week": 1 }
    },
    {
      $project: {
        _id: 0,
        name: {
          $concat: [
            "Week ",
            { $toString: "$_id.week" }
          ]
        },
        applications: 1
      }
    }
  ]);

  // Get job views data for chart - all job views
  const viewsData = await JobView.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          week: { $week: "$createdAt" },
          year: { $year: "$createdAt" }
        },
        views: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.week": 1 }
    },
    {
      $project: {
        _id: 0,
        name: {
          $concat: [
            "Week ",
            { $toString: "$_id.week" }
          ]
        },
        views: 1
      }
    }
  ]);

  // Get job position performance data for all active jobs
  const allActiveJobs = await Job.find({ applyBy: { $gt: new Date() } })
    .populate("company", "name")
    .limit(10); // Limit to top 10 jobs for performance
  
  const positionStats = await Promise.all(
    allActiveJobs.map(async (job) => {
      const jobViews = await JobView.countDocuments({ job: job._id });
      const applications = await ApplyClick.countDocuments({ job: job._id });
      
      const conversionRate = jobViews > 0 
        ? ((applications / jobViews) * 100).toFixed(1) 
        : 0;
      
      return {
        id: job._id,
        title: job.title,
        company: job.company?.name || 'Unknown Company',
        views: jobViews,
        applications,
        conversionRate: `${conversionRate}%`,
        status: 'Active'
      };
    })
  );

  // Calculate application growth compared to previous period
  const previousPeriodStart = new Date(startDate);
  const timeDiff = currentDate - startDate;
  previousPeriodStart.setTime(previousPeriodStart.getTime() - timeDiff);
  
  const previousPeriodApplications = await ApplyClick.countDocuments({
    createdAt: { $gte: previousPeriodStart, $lt: startDate }
  });
  
  const applicationGrowth = previousPeriodApplications > 0 
    ? ((totalApplications - previousPeriodApplications) / previousPeriodApplications * 100).toFixed(1)
    : 100;

  // Calculate views growth
  const previousPeriodViews = await JobView.countDocuments({
    createdAt: { $gte: previousPeriodStart, $lt: startDate }
  });
  
  const viewsGrowth = previousPeriodViews > 0 
    ? ((totalJobViews - previousPeriodViews) / previousPeriodViews * 100).toFixed(1)
    : 100;

  // Calculate conversion rate growth
  const previousConversionRate = previousPeriodViews > 0 
    ? (previousPeriodApplications / previousPeriodViews) * 100
    : 0;
  
  const conversionGrowth = previousConversionRate > 0 
    ? ((parseFloat(conversionRate) - previousConversionRate) / previousConversionRate * 100).toFixed(1)
    : 100;

  // Prepare response data
  const analyticsData = {
    kpiData: {
      totalApplications,
      applicationGrowth,
      totalViews: totalJobViews,
      systemWideViews: totalJobViews, // Add for backward compatibility with frontend
      systemWideApplyClicks: totalApplications, // Add for backward compatibility with frontend
      viewsGrowth,
      conversionRate,
      conversionGrowth,
      totalActiveJobs,
      activeJobs: totalActiveJobs, // Add for backward compatibility with frontend
    },
    applicationsData,
    viewsData,
    positionStats
  };

    return res.status(200).json({
      success: true,
      data: analyticsData,
      message: "Analytics data retrieved successfully"
    });
  } catch (error) {
    console.error("Error retrieving analytics data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve analytics data"
    });
  }
};

const trackJobView = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Better debugging of the user object
    console.log('User data in request:', JSON.stringify(req.user));
    
    // More flexible user ID extraction
    let userId = null;
    if (req.user) {
      userId = req.user._id || req.user.id || req.user.userId;
    }
    const userRole = req.user ? req.user.role : null;
    
    console.log('Extracted user data:', { userId, userRole });
    
    // Validation checks
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required"
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required for tracking",
        debug: { user: req.user }
      });
    }

    // Only track views from students (candidates are also considered students in this context)
    if (userRole !== 'student') {
      console.log(`Job view not tracked: User role is ${userRole}, not student`);
      return res.status(200).json({
        success: true,
        message: "Job view not tracked: User is not a student",
        counted: false
      });
    }
    
    // Create or update job view record
    const jobView = await JobView.findOneAndUpdate(
      { job: jobId, user: userId },
      { 
        viewedAt: new Date(),
        user: userId 
      },
      { upsert: true, new: true }
    );
    
    console.log('Job view tracked successfully:', jobView);

    return res.status(200).json({
      success: true,
      message: "Job view tracked successfully",
      counted: true,
      jobView
    });
  } catch (error) {
    // If it's a duplicate key error, it's already tracked, so return success
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Job view already tracked",
        counted: false
      });
    }
    console.error("Error tracking job view:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to track job view",
      error: error.message
    });
  }
};

const trackApplyClick = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Better debugging of the user object
    console.log('User data in request (apply click):', JSON.stringify(req.user));
    
    // More flexible user ID extraction
    let userId = null;
    if (req.user) {
      userId = req.user._id || req.user.id || req.user.userId;
    }
    const userRole = req.user ? req.user.role : null;
    
    console.log('Extracted user data (apply click):', { userId, userRole });
    
    // Validation checks
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required"
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required for tracking",
        debug: { user: req.user }
      });
    }

    // Only track apply clicks from students
    if (userRole !== 'student') {
      console.log(`Apply click not tracked: User role is ${userRole}, not student`);
      return res.status(200).json({
        success: true,
        message: "Apply click not tracked: User is not a student",
        counted: false
      });
    }
    
    // Create or update apply click record
    const applyClick = await ApplyClick.findOneAndUpdate(
      { job: jobId, user: userId },
      { 
        clickedAt: new Date(),
        user: userId 
      },
      { upsert: true, new: true }
    );
    
    console.log('Apply click tracked successfully:', applyClick);

    return res.status(200).json({
      success: true,
      message: "Apply click tracked successfully",
      counted: true,
      applyClick
    });
  } catch (error) {
    // If it's a duplicate key error, it's already tracked, so return success
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Apply click already tracked",
        counted: false
      });
    }
    console.error("Error tracking apply click:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to track apply click",
      error: error.message
    });
  }
};

const getTotalActiveJobs = async (req, res) => {
  try {
    // Count all active jobs (where apply-by date is in the future)
    const totalActiveJobs = await Job.countDocuments({
      applyBy: { $gt: new Date() }
    });

    return res.status(200).json({
      success: true,
      data: { totalActiveJobs },
      message: "Total active jobs count retrieved successfully"
    });
  } catch (error) {
    console.error("Error retrieving total active jobs count:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve total active jobs count"
    });
  }
};

export { getRecruiterAnalytics, trackJobView, trackApplyClick, getTotalActiveJobs };
