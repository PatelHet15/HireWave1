import React, { useState } from "react";
import Navbar from "../shared/Navbar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useSelector } from "react-redux";
import axios from "axios";
import { JOB_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, Briefcase, MapPin, Calendar, Building2, Users, Banknote, GraduationCap } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { motion } from "framer-motion";

const availablePerks = [
    "Certificate",
    "Flexible Hours",
    "Letter of Recommendation",
    "Part-Time Allowed",
    "Work From Home",
    "Health Insurance",
];

const PostJob = () => {
    const [input, setInput] = useState({
        title: "",
        description: "",
        requirements: "",
        salary: "",
        jobLocation: "",
        jobType: "",
        experienceLevel: "",
        position: "",
        companyID: "",
        applyBy: "",
        perks: [],
        openings: "",
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const { companies } = useSelector((store) => store.company);
    const [selectedCompany, setSelectedCompany] = useState(null);

    const changeEventHandler = (e) => {
        const { name, value } = e.target;
        setInput({ ...input, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const handleCompanyChange = (company) => {
        setSelectedCompany(company);
        setInput({ ...input, companyID: company._id });
        setErrors({ ...errors, companyID: "" });
    };

    const handlePerkChange = (perk) => {
        setInput((prev) => {
            const isSelected = prev.perks.includes(perk);
            return {
                ...prev,
                perks: isSelected
                    ? prev.perks.filter((p) => p !== perk)
                    : [...prev.perks, perk],
            };
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!input.title) newErrors.title = "Title is required";
        if (!input.description) newErrors.description = "Description is required";
        if (!input.requirements) newErrors.requirements = "Skills are required";
        if (!input.salary) newErrors.salary = "Salary is required";
        if (!input.jobLocation) newErrors.jobLocation = "Location is required";
        if (!input.jobType) newErrors.jobType = "Job type is required";
        if (!input.experienceLevel) newErrors.experienceLevel = "Experience level is required";
        if (!input.position) newErrors.position = "Position is required";
        if (!input.openings) newErrors.openings = "Number of openings is required";
        if (!input.applyBy) newErrors.applyBy = "Application deadline is required";
        if (!input.companyID) newErrors.companyID = "Please select a company";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        console.log("Submit handler triggered"); // Debugging log
    
        if (!validateForm()) {
            console.log("Form validation failed", errors);
            return;
        }
    
        console.log("Form validation passed", input);
    
        try {
            setLoading(true);
            const payload = {
                ...input,
                requirements: input.requirements.split(",").map((skill) => skill.trim()),
                salary: Number(input.salary),
                openings: Number(input.openings),
                applyBy: new Date(input.applyBy).toISOString(),
            };
    
            console.log("Payload to be sent:", payload);
    
            const res = await axios.post(`${JOB_API_END_POINT}/post`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('token') && {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    })
                }
            });
    
            console.log("Response received:", res.data);
    
            if (res.data.success) {
                toast.success(res.data.message);
                navigate("/admin/jobs");
            } else {
                toast.error(res.data.message || "Failed to post job");
            }
        } catch (error) {
            console.error("Error posting job:", error);
            toast.error(error.response?.data?.message || "An error occurred while posting the job");
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <motion.div 
                className="container mx-auto px-4 py-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Post a New Job Opportunity
                    </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Fill in the details below to create a new job posting
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Form Column */}
                        <div className="lg:col-span-2">
                            <form onSubmit={submitHandler} className="space-y-6">
                                {/* Basic Information Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="p-6">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center mb-6">
                                            <Briefcase className="mr-2 h-5 w-5 text-blue-500" />
                                            Basic Information
                                        </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Title</Label>
                                                <Input
                                                    name="title"
                                                    value={input.title}
                                                    onChange={changeEventHandler}
                                                    placeholder="e.g. senior Software Engineer"
                                                    className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
                                                />
                                                {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                        </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</Label>
    <Input
        name="position"
        value={input.position}
        onChange={changeEventHandler}
                                                    placeholder="e.g. Full Stack Developer"
                                                    className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
                                                />
                                                {errors.position && <p className="text-red-500 text-sm">{errors.position}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                                    <Banknote className="mr-2 h-4 w-4 text-gray-500" />
                                                    Salary (LPA)
                                                </Label>
                                                <Input
                                                    name="salary"
                                                    type="number"
                                                    value={input.salary}
                                                    onChange={changeEventHandler}
                                                    placeholder="e.g. 12"
                                                    className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
                                                />
                                                {errors.salary && <p className="text-red-500 text-sm">{errors.salary}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                                    <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                                                    Location
                                                </Label>
                                                <Input
                                                    name="jobLocation"
                                                    value={input.jobLocation}
                                                    onChange={changeEventHandler}
                                                    placeholder="e.g. New York, NY"
                                                    className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
                                                />
                                                {errors.jobLocation && <p className="text-red-500 text-sm">{errors.jobLocation}</p>}
                                            </div>
                                        </div>
                                    </div>
</div>

                                {/* Job Details Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="p-6">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center mb-6">
                                            <GraduationCap className="mr-2 h-5 w-5 text-blue-500" />
                                            Job Details
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Type</Label>
                                                <Input
                                                    name="jobType"
                                                    value={input.jobType}
                                                    onChange={changeEventHandler}
                                                    placeholder="Full-time / Internship"
                                                    className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
                                                />
                                                {errors.jobType && <p className="text-red-500 text-sm">{errors.jobType}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Experience Level</Label>
                                                <Input
                                                    name="experienceLevel"
                                                    value={input.experienceLevel}
                                                    onChange={changeEventHandler}
                                                    placeholder="Entry / Mid / senior"
                                                    className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
                                                />
                                                {errors.experienceLevel && <p className="text-red-500 text-sm">{errors.experienceLevel}</p>}
                        </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                                    <Users className="mr-2 h-4 w-4 text-gray-500" />
                                                    Number of Openings
                                                </Label>
                                                <Input
                                                    name="openings"
                                                    type="number"
                                                    value={input.openings}
                                                    onChange={changeEventHandler}
                                                    placeholder="e.g. 5"
                                                    className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
                                                />
                                                {errors.openings && <p className="text-red-500 text-sm">{errors.openings}</p>}
                        </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                                                    Application Deadline
                                                </Label>
                                                <Input
                                                    name="applyBy"
                                                    type="date"
                                                    value={input.applyBy}
                                                    onChange={changeEventHandler}
                                                    className="border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
                                                />
                                                {errors.applyBy && <p className="text-red-500 text-sm">{errors.applyBy}</p>}
                        </div>
                        </div>
                        </div>
                        </div>

                                {/* Company Selection Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="p-6">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center mb-6">
                                            <Building2 className="mr-2 h-5 w-5 text-blue-500" />
                                            Company Information
                                        </h2>
                                        <div className="space-y-4">
                                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Company</Label>
                            <Listbox value={selectedCompany} onChange={handleCompanyChange}>
                                                <div className="relative mt-1">
                                                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-gray-50 dark:bg-gray-700 py-2 pl-3 pr-10 text-left border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                        <span className="block truncate">
                                        {selectedCompany ? selectedCompany.name : "Select a Company"}
                                                        </span>
                                    </Listbox.Button>
                                                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        {companies.map((company) => (
                                                            <Listbox.Option
                                                                key={company._id}
                                                                value={company}
                                                                className={({ active }) =>
                                                                    `${active ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}
                                                                    cursor-pointer select-none relative py-2 pl-10 pr-4`
                                                                }
                                                            >
                                                {company.name}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </div>
                            </Listbox>
                                            {errors.companyID && <p className="text-red-500 text-sm">{errors.companyID}</p>}
                                        </div>
                        </div>
                    </div>

                                {/* Job Perks Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="p-6">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Job Perks</h2>
                                        <div className="grid grid-cols-2 gap-3">
                        {availablePerks.map((perk) => (
                                                <label key={perk} className="flex items-center p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={input.perks.includes(perk)}
                                                        onChange={() => handlePerkChange(perk)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{perk}</span>
                            </label>
                        ))}
                                        </div>
                                    </div>
                    </div>

                                {/* Description and Requirements Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="p-6">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                                            Job Description & Requirements
                                        </h2>
                                        <div className="space-y-6">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Description</Label>
                                                <Textarea
                                                    name="description"
                                                    value={input.description}
                                                    onChange={changeEventHandler}
                                                    placeholder="Enter detailed job description..."
                                                    className="mt-1 h-32 border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
                                                />
                                                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Required Skills</Label>
                                                <Textarea
                                                    name="requirements"
                                                    value={input.requirements}
                                                    onChange={changeEventHandler}
                                                    placeholder="Enter required skills (comma-separated)..."
                                                    className="mt-1 h-32 border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
                                                />
                                                {errors.requirements && <p className="text-red-500 text-sm mt-1">{errors.requirements}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button Container */}
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        className="w-48 bg-blue-600 hover:bg-blue-800 text-white py-3 rounded-lg shadow-sm"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Posting Job...
                                            </>
                                        ) : (
                                            'Post New Job'
                                        )}
                    </Button>
                                </div>
                </form>
            </div>

                        {/* Helpful Sidebar */}
                        <div className="space-y-6 lg:sticky lg:top-6 self-start">
                            {/* Quick Tips Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        Tips for a Great Job Post
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 dark:text-blue-400 font-semibold">1</span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Be Specific</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Clear job titles and descriptions attract better candidates</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 dark:text-blue-400 font-semibold">2</span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">List Requirements</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Include must-have skills and experience levels</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 dark:text-blue-400 font-semibold">3</span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Highlight Benefits</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Showcase what makes your job opportunity unique</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Card - Now Sticky */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 sticky top-[250px]">
                                <div className="p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        Platform Statistics
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Active Job Seekers</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">5,000+</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Average Applications</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">25 per post</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Response Rate</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">85%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Need Help Card - Now Sticky */}
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm sticky top-[500px]">
                                <div className="p-6">
                                    <h2 className="text-xl font-semibold text-white mb-2">Need Help?</h2>
                                    <p className="text-blue-100 text-sm mb-4">Our team is here to assist you with your job posting</p>
                                    <button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg transition-colors">
                                        Contact Support
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PostJob;
