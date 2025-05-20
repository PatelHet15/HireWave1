const User = require("../models/user.model");
const cloudinary = require("cloudinary").v2;
const { uploadToCloudinary } = require("../utils/cloudinary");

const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const updateData = { ...req.body };

        // Handle file uploads
        if (req.files) {
            if (req.files.profilePhoto) {
                const profilePhotoUrl = await uploadToCloudinary(req.files.profilePhoto[0]);
                updateData["profile.profilePhoto"] = profilePhotoUrl;
            }
            if (req.files.resume) {
                const resumeUrl = await uploadToCloudinary(req.files.resume[0]);
                updateData["profile.resume"] = resumeUrl;
                updateData["profile.resumeOriginalName"] = req.files.resume[0].originalname;
                updateData["profile.resumeUpdatedAt"] = new Date(); // Set resume update timestamp
                updateData["profile.resumeAnalysis"] = null; // Clear previous analysis
            }
        }

        // Handle skills array
        if (updateData.skills) {
            updateData["profile.skills"] = updateData.skills.split(",").map(skill => skill.trim());
            delete updateData.skills;
        }

        // Handle arrays (internships, projects, employmentHistory)
        if (updateData.internships) {
            updateData["profile.internships"] = JSON.parse(updateData.internships);
            delete updateData.internships;
        }
        if (updateData.projects) {
            updateData["profile.projects"] = JSON.parse(updateData.projects);
            delete updateData.projects;
        }
        if (updateData.employmentHistory) {
            updateData["profile.employmentHistory"] = JSON.parse(updateData.employmentHistory);
            delete updateData.employmentHistory;
        }

        // Handle date fields
        if (updateData.dob) {
            updateData["profile.dob"] = new Date(updateData.dob);
            delete updateData.dob;
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({
            success: false,
            message: "Error updating profile",
            error: error.message
        });
    }
};

module.exports = {
    updateProfile
}; 