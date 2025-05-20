import { Company } from "../models/company.model.js";
import cloudinary from "../utils/cloudinary.js";
import getDataUri from "../utils/datauri.js";

export const registerCompany = async (req, res) => {
    try {
        const { companyName, aboutCompany, website, location } = req.body;
        const file = req.file;

        if (!companyName) {
            return res.status(400).json({
                message: "Company name is required.",
                success: false
            });
        }

        let company = await Company.findOne({ name: companyName });
        if (company) {
            return res.status(400).json({
                message: "You can't register the same company.",
                success: false
            });
        }

        // Create new company object with all available fields
        const companyData = {
            name: companyName,
            userId: req.id
        };

        // Add optional fields if they exist
        if (aboutCompany) companyData.aboutCompany = aboutCompany;
        if (website) companyData.website = website;
        if (location) companyData.location = location;

        // Process logo upload if a file is provided
        if (file) {
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            companyData.logo = cloudResponse.secure_url;
        }

        // Create the company with all the fields
        company = await Company.create(companyData);

        return res.status(201).json({
            message: "Company registered successfully.",
            company,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

export const getCompanies = async (req, res) => {
    try {
        const companies = await Company.find({ userId: req.id }); // Only return companies registered by this recruiter
        return res.status(200).json({
            companies,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};


export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            });
        }
        return res.status(200).json({
            company,
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};

export const updateCompany = async (req, res) => {
    try {
        const { name, aboutCompany, website, location } = req.body;
        
        // When using multipleUpload middleware, files are in req.files
        const profilePhoto = req.files && req.files.profilePhoto && req.files.profilePhoto[0];

        let updateData = { name, aboutCompany, website, location };

        if (profilePhoto) {
            const fileUri = getDataUri(profilePhoto);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            updateData.logo = cloudResponse.secure_url;
        }

        const company = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            });
        }

        return res.status(200).json({
            message: "Company information updated.",
            company,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

// Get the company associated with the currently logged-in recruiter
export const getRecruiterCompany = async (req, res) => {
    try {
        const userId = req.id;
        
        // Find the first company created by this recruiter
        const company = await Company.findOne({ userId });
        
        if (!company) {
            return res.status(404).json({
                message: "You haven't created a company yet.",
                success: false
            });
        }
        
        return res.status(200).json({
            company,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error fetching recruiter's company.",
            success: false
        });
    }
};
