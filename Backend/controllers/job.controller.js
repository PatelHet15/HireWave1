    import { Job } from "../models/job.model.js";
import { Company } from "../models/company.model.js";

// Admin - Post a Job
export const postJob = async (req, res) => {
  try {
    const { 
      title, description, requirements, salary, jobLocation, jobType, 
      experienceLevel, position, companyID, openings, applyBy, perks 
    } = req.body;

    const userId = req.id;

    if (!title || !description || !requirements || !salary || !jobLocation || !jobType || 
        !experienceLevel || !position || !companyID || !openings || !applyBy) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }

    const job = await Job.create({
      title,
      description,
      requirements: Array.isArray(requirements) ? requirements : requirements.split(","),
      salary: Number(salary),
      jobLocation,
      jobType,
      experienceLevel,
      position,
      company: companyID,
      created_by: userId,
      openings: Number(openings),
      applyBy: new Date(applyBy),  
      perks: perks || [],
    });

    res.status(201).json({
      message: "New job created successfully",
      job,
      success: true,
    });

  } catch (error) {
    console.error("Error posting job:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const updateCandidateStatus = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;
    const { status } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found", success: false });
    }

    const candidateProgress = job.candidateProgress.find(
      cp => cp.applicant.toString() === candidateId
    );

    if (!candidateProgress) {
      return res.status(404).json({ message: "Candidate not found in this job's pipeline", success: false });
    }

    candidateProgress.overallStatus = status;

    if (status === 'hired' || status === 'rejected') {
      // Move candidate to the final stage
      const finalRound = job.interviewRounds[job.interviewRounds.length - 1];
      candidateProgress.currentRound = finalRound._id;
      candidateProgress.roundsStatus.push({
        round: finalRound._id,
        status: status === 'hired' ? 'passed' : 'failed',
        completedAt: new Date()
      });
    }

    await job.save();

    res.status(200).json({
      message: "Candidate status updated successfully",
      success: true,
      candidateProgress
    });
  } catch (error) {
    console.error("Error updating candidate status:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};


// Get All Jobs (for students)
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({})
      .populate("company", "name location logo")
      .sort({ createdAt: -1 });

    res.status(200).json({ jobs, success: true });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Get job by ID
export const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId)
      .populate("company", "name aboutCompany location website")
      .populate({
        path: "applications",
        populate: {
          path: "applicant",
          select: "_id",
        },
      });
    
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }
    
    // Find similar jobs based on position OR location
    let similarJobs = await Job.find({
      $or: [
        { position: job.position },
        { jobLocation: { $regex: new RegExp(`^${job.jobLocation}$`, "i") } },
      ],
      _id: { $ne: jobId },
    })
    .populate("company", "name location logo website")
    .select("title company jobLocation jobType position salary experienceLevel requirements applyBy openings perks createdAt")
    .limit(5);
    
    res.status(200).json({
      job,
      similarJobs,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};
  

// Get jobs created by the admin
export const getAdminJobs = async (req, res) => {
  try {
    const adminId = req.id;
    const jobs = await Job.find({ created_by: adminId }).populate("company").sort({ createdAt: -1 });

    res.status(200).json({
      jobs,
      success: true,
    });

  } catch (error) {
    console.error("Error fetching admin jobs:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Update a job posting
export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.id;
    
    // Get the job to check ownership
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false
      });
    }
    
    // Check if user owns this job
    if (job.created_by.toString() !== userId) {
      return res.status(403).json({
        message: "You are not authorized to update this job",
        success: false
      });
    }
    
    // Extract fields from request body
    const { 
      title, description, salary, experienceLevel, jobLocation, 
      jobType, requiredSkills, applicationDeadline
    } = req.body;
    
    // Create update object with only the fields that are provided
    const updateData = {};
    
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (salary) updateData.salary = Number(salary);
    if (experienceLevel) updateData.experienceLevel = experienceLevel;
    if (jobLocation) updateData.jobLocation = jobLocation;
    if (jobType) updateData.jobType = jobType;
    
    // Handle arrays
    if (requiredSkills) {
      updateData.requirements = Array.isArray(requiredSkills)
        ? requiredSkills
        : requiredSkills;
    }
    
    // Handle dates
    if (applicationDeadline) {
      updateData.applyBy = new Date(applicationDeadline);
    }
    
    // Update the job
    const updatedJob = await Job.findByIdAndUpdate(
      jobId, 
      updateData, 
      { new: true, runValidators: true }
    ).populate("company");
    
    if (!updatedJob) {
      return res.status(404).json({
        message: "Failed to update job",
        success: false
      });
    }
    
    return res.status(200).json({
      message: "Job updated successfully",
      job: updatedJob,
      success: true
    });
    
  } catch (error) {
    console.error("Error updating job:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};
