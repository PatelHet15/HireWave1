import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "./ui/select";
import { Loader2, User, Calendar, Mail, Phone, MapPin, FileText, Upload, GraduationCap, BookOpen, Briefcase, Code, History } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { setUser } from "@/Redux/authSlice";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Custom shadow class to match Profile page
const cardShadow = "shadow-[0_4px_20px_-2px_rgba(66,153,225,0.18)]";

const courses = {
    BSc: ["Computer Science", "Biotechnology", "Mathematics", "Physics", "Chemistry"],
    BTech: ["Computer Science", "Electrical", "Mechanical", "Civil", "Electronics"],
    MTech: ["Artificial Intelligence", "Data Science", "Robotics", "Cyber Security"],
    MBA: ["Finance", "Marketing", "Human Resources", "Operations Management"]
};

const UpdateProfileDialog = ({ open, setOpen, editingSection, setEditingSection }) => {
    const [loading, setLoading] = useState(false);
    const { user } = useSelector((store) => store.auth);
    const dispatch = useDispatch();

    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);

    const [input, setInput] = useState({
        // Personal Information
        fullname: user?.fullname || "",
        email: user?.email || "",
        phoneNumber: user?.phoneNumber || "",
        bio: user?.profile?.bio || "",
        location: user?.profile?.location || "",
        skills: user?.profile?.skills?.join(", ") || "",
        file: null,
        courseField: user?.profile?.courseField || "",
        courseName: user?.profile?.courseName || "",
        dob: user?.profile?.dob ? new Date(user.profile.dob).toISOString().split("T")[0] : "",
        gender: user?.profile?.gender || "",

        // Preferences
        preferredLocation: user?.profile?.preferredLocation || "",
        jobType: user?.profile?.jobType || "",
        preferredRole: user?.profile?.preferredRole || "",

        // Education
        collegeName: user?.profile?.collegeName || "",
        collegeYear: user?.profile?.collegeYear || "",
        twelfthSchool: user?.profile?.twelfthSchool || "",
        twelfthYear: user?.profile?.twelfthYear || "",
        twelfthPercentage: user?.profile?.twelfthPercentage || "",
        tenthSchool: user?.profile?.tenthSchool || "",
        tenthYear: user?.profile?.tenthYear || "",
        tenthPercentage: user?.profile?.tenthPercentage || "",

        // Internships
        internships: user?.profile?.internships || [],

        // Projects
        projects: user?.profile?.projects || [],

        // Employment History
        employmentHistory: user?.profile?.employmentHistory || []
    });

    const profilePhotoChangeHandler = (e) => {
        const file = e.target.files?.[0];
        setProfilePhotoFile(file);
    };

    const resumeChangeHandler = (e) => {
        const file = e.target.files?.[0];
        setResumeFile(file);
    };

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const fileChangeHandler = (e) => {
        const file = e.target.files?.[0];
        setInput({ ...input, file });
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        const formData = new FormData();

        // Add all fields to formData
        Object.keys(input).forEach(key => {
            if (Array.isArray(input[key])) {
                formData.append(key, JSON.stringify(input[key]));
            } else {
                formData.append(key, input[key]);
            }
        });

        if (profilePhotoFile) formData.append("profilePhoto", profilePhotoFile);
        if (resumeFile) formData.append("resume", resumeFile);

        // Get token from localStorage for authentication
        const token = localStorage.getItem('token');
        
        if (!token) {
            toast.error("Authentication required. Please log in again.");
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`${USER_API_END_POINT}/update-profile`, formData, {
                headers: { 
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`
                },
                withCredentials: true
            });

            if (res.data.success) {
                dispatch(setUser(res.data.user));
                toast.success(res.data.message);
                setOpen(false);
                setEditingSection(null);
            }
        } catch (error) {
            console.log(error);
            if (error.response?.status === 401) {
                toast.error("Your session has expired. Please log in again.");
            } else {
                toast.error(error.response?.data?.message || "Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    };

    const renderSection = () => {
        switch (editingSection) {
            case 'bio':
                return (
                    <div className="space-y-2.5 mb-3">
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium">Bio</Label>
                            <textarea
                                name="bio"
                                value={input.bio}
                                onChange={changeEventHandler}
                                placeholder="Tell us about yourself"
                                rows={4}
                                className="w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-0 text-sm px-3 py-2 resize-none"
                                autoFocus={false}
                            />
                        </div>
                    </div>
                );

            case 'skills':
                return (
                    <div className="space-y-2.5 mb-3">
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium">Skills</Label>
                            <Input
                                name="skills"
                                value={input.skills}
                                onChange={changeEventHandler}
                                placeholder="Enter your skills (comma-separated)"
                                className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                autoFocus={false}
                            />
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="space-y-2.5 mb-3">
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium">Full Name</Label>
                            <Input
                                name="fullname"
                                value={input.fullname}
                                onChange={changeEventHandler}
                                placeholder="Enter your full name"
                                className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                autoFocus={false}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium">Email</Label>
                            <Input
                                name="email"
                                value={input.email}
                                onChange={changeEventHandler}
                                placeholder="Enter your email"
                                className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                autoFocus={false}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium">Phone Number</Label>
                            <Input
                                name="phoneNumber"
                                value={input.phoneNumber}
                                onChange={changeEventHandler}
                                placeholder="Enter your phone number"
                                className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                autoFocus={false}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium">Location</Label>
                            <Input
                                name="location"
                                value={input.location}
                                onChange={changeEventHandler}
                                placeholder="Enter your location"
                                className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                autoFocus={false}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium">Date of Birth</Label>
                            <Input
                                name="dob"
                                type="date"
                                value={input.dob}
                                onChange={changeEventHandler}
                                className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                autoFocus={false}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium">Gender</Label>
                            <Select
                                onValueChange={(value) => setInput({ ...input, gender: value })}
                                value={input.gender}
                            >
                                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-0">
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium">Profile Photo</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={profilePhotoChangeHandler}
                                className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                autoFocus={false}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium">Resume</Label>
                            <Input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={resumeChangeHandler}
                                className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                autoFocus={false}
                            />
                        </div>
                    </div>
                );

            case 'preferences':
                return (
                    <div className="space-y-2.5 mb-3">
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium">Preferred Location</Label>
                            <Input
                                name="preferredLocation"
                                value={input.preferredLocation}
                                onChange={changeEventHandler}
                                placeholder="Enter your preferred location"
                                className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                autoFocus={false}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium">Job Type</Label>
                            <Select
                                onValueChange={(value) => setInput({ ...input, jobType: value })}
                                value={input.jobType}
                            >
                                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-0">
                                    <SelectValue placeholder="Select job type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Full Time">Full Time</SelectItem>
                                    <SelectItem value="Part Time">Part Time</SelectItem>
                                    <SelectItem value="Internship">Internship</SelectItem>
                                    <SelectItem value="Contract">Contract</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium">Preferred Role</Label>
                            <Input
                                name="preferredRole"
                                value={input.preferredRole}
                                onChange={changeEventHandler}
                                placeholder="Enter your preferred role"
                                className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                autoFocus={false}
                            />
                        </div>
                    </div>
                );

            case 'education':
                return (
                    <div className="space-y-6">
                        {/* College Education */}
                        <div className="space-y-2.5 mb-5">
                            <h3 className="text-sm font-medium text-gray-900">College Education</h3>
                            <div className="space-y-1.5">
                                <Label className="text-gray-700 font-medium">Degree Type</Label>
                                <Select
                                    onValueChange={(value) => setInput({ ...input, courseField: value })}
                                    value={input.courseField}
                                >
                                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-0">
                                        <SelectValue placeholder="Select degree type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(courses).map((courseType) => (
                                            <SelectItem key={courseType} value={courseType}>
                                                {courseType}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-gray-700 font-medium">Course Name</Label>
                                <Select
                                    onValueChange={(value) => setInput({ ...input, courseName: value })}
                                    value={input.courseName}
                                    disabled={!input.courseField}
                                >
                                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-0">
                                        <SelectValue placeholder={input.courseField ? "Select course" : "Select degree type first"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {input.courseField && courses[input.courseField]?.map((course) => (
                                            <SelectItem key={course} value={course}>
                                                {course}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-gray-700 font-medium">College Name</Label>
                                <Input
                                    name="collegeName"
                                    value={input.collegeName}
                                    onChange={changeEventHandler}
                                    placeholder="Enter your college name"
                                    className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                    autoFocus={false}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-gray-700 font-medium">Year</Label>
                                <Input
                                    name="collegeYear"
                                    value={input.collegeYear}
                                    onChange={changeEventHandler}
                                    placeholder="Enter year"
                                    className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                    autoFocus={false}
                                />
                            </div>
                        </div>

                        {/* 12th Education */}
                        <div className="space-y-2.5 mb-3">
                            <h3 className="text-sm font-medium text-gray-900">12th Standard</h3>
                            <div className="space-y-1.5">
                                <Label className="text-gray-700 font-medium">School Name</Label>
                                <Input
                                    name="twelfthSchool"
                                    value={input.twelfthSchool}
                                    onChange={changeEventHandler}
                                    placeholder="Enter your school name"
                                    className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                    autoFocus={false}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Year</Label>
                                    <Input
                                        name="twelfthYear"
                                        value={input.twelfthYear}
                                        onChange={changeEventHandler}
                                        placeholder="Enter year"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Percentage</Label>
                                    <Input
                                        name="twelfthPercentage"
                                        value={input.twelfthPercentage}
                                        onChange={changeEventHandler}
                                        placeholder="Enter percentage"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 10th Education */}
                        <div className="space-y-2.5 mb-3">
                            <h3 className="text-sm font-medium text-gray-900">10th Standard</h3>
                            <div className="space-y-1.5">
                                <Label className="text-gray-700 font-medium">School Name</Label>
                                <Input
                                    name="tenthSchool"
                                    value={input.tenthSchool}
                                    onChange={changeEventHandler}
                                    placeholder="Enter your school name"
                                    className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                    autoFocus={false}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Year</Label>
                                    <Input
                                        name="tenthYear"
                                        value={input.tenthYear}
                                        onChange={changeEventHandler}
                                        placeholder="Enter year"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                                <div className="space-y-1.5 mb-3">
                                    <Label className="text-gray-700 font-medium">Percentage</Label>
                                    <Input
                                        name="tenthPercentage"
                                        value={input.tenthPercentage}
                                        onChange={changeEventHandler}
                                        placeholder="Enter percentage"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'internships':
                return (
                    <div className="space-y-2.5 mb-3">
                        {input.internships.map((internship, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-medium text-gray-900">Internship {index + 1}</h3>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const newInternships = [...input.internships];
                                            newInternships.splice(index, 1);
                                            setInput({ ...input, internships: newInternships });
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        Remove
                                    </Button>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Role</Label>
                                    <Input
                                        value={internship.role}
                                        onChange={(e) => {
                                            const newInternships = [...input.internships];
                                            newInternships[index] = { ...internship, role: e.target.value };
                                            setInput({ ...input, internships: newInternships });
                                        }}
                                        placeholder="Enter role"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Company</Label>
                                    <Input
                                        value={internship.company}
                                        onChange={(e) => {
                                            const newInternships = [...input.internships];
                                            newInternships[index] = { ...internship, company: e.target.value };
                                            setInput({ ...input, internships: newInternships });
                                        }}
                                        placeholder="Enter company name"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Duration</Label>
                                    <Input
                                        value={internship.duration}
                                        onChange={(e) => {
                                            const newInternships = [...input.internships];
                                            newInternships[index] = { ...internship, duration: e.target.value };
                                            setInput({ ...input, internships: newInternships });
                                        }}
                                        placeholder="e.g., Jan 2023 - Mar 2023"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Description</Label>
                                    <textarea
                                        value={internship.description}
                                        onChange={(e) => {
                                            const newInternships = [...input.internships];
                                            newInternships[index] = { ...internship, description: e.target.value };
                                            setInput({ ...input, internships: newInternships });
                                        }}
                                        placeholder="Describe your responsibilities and achievements"
                                        rows={3}
                                        className="w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-0 text-sm px-3 py-2 resize-none"
                                        autoFocus={false}
                                    />
                                </div>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setInput({
                                    ...input,
                                    internships: [...input.internships, { role: "", company: "", duration: "", description: "" }]
                                });
                            }}
                            className="w-full"
                        >
                            Add Internship
                        </Button>
                    </div>
                );

            case 'projects':
                return (
                    <div className="space-y-2.5 mb-3">
                        {input.projects.map((project, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-medium text-gray-900">Project {index + 1}</h3>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const newProjects = [...input.projects];
                                            newProjects.splice(index, 1);
                                            setInput({ ...input, projects: newProjects });
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        Remove
                                    </Button>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Project Name</Label>
                                    <Input
                                        value={project.name}
                                        onChange={(e) => {
                                            const newProjects = [...input.projects];
                                            newProjects[index] = { ...project, name: e.target.value };
                                            setInput({ ...input, projects: newProjects });
                                        }}
                                        placeholder="Enter project name"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Technologies Used</Label>
                                    <Input
                                        value={project.technologies}
                                        onChange={(e) => {
                                            const newProjects = [...input.projects];
                                            newProjects[index] = { ...project, technologies: e.target.value };
                                            setInput({ ...input, projects: newProjects });
                                        }}
                                        placeholder="e.g., React, Node.js, MongoDB"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Duration</Label>
                                    <Input
                                        value={project.duration}
                                        onChange={(e) => {
                                            const newProjects = [...input.projects];
                                            newProjects[index] = { ...project, duration: e.target.value };
                                            setInput({ ...input, projects: newProjects });
                                        }}
                                        placeholder="e.g., Jan 2023 - Mar 2023"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Description</Label>
                                    <textarea
                                        value={project.description}
                                        onChange={(e) => {
                                            const newProjects = [...input.projects];
                                            newProjects[index] = { ...project, description: e.target.value };
                                            setInput({ ...input, projects: newProjects });
                                        }}
                                        placeholder="Describe your project"
                                        rows={3}
                                        className="w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-0 text-sm px-3 py-2 resize-none"
                                        autoFocus={false}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Project Link</Label>
                                    <Input
                                        value={project.link}
                                        onChange={(e) => {
                                            const newProjects = [...input.projects];
                                            newProjects[index] = { ...project, link: e.target.value };
                                            setInput({ ...input, projects: newProjects });
                                        }}
                                        placeholder="Enter project URL"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setInput({
                                    ...input,
                                    projects: [...input.projects, { name: "", technologies: "", duration: "", description: "", link: "" }]
                                });
                            }}
                            className="w-full"
                        >
                            Add Project
                        </Button>
                    </div>
                );

            case 'employment':
                return (
                    <div className="space-y-2.5 mb-3">
                        {input.employmentHistory.map((job, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-medium text-gray-900">Job {index + 1}</h3>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const newJobs = [...input.employmentHistory];
                                            newJobs.splice(index, 1);
                                            setInput({ ...input, employmentHistory: newJobs });
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        Remove
                                    </Button>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Role</Label>
                                    <Input
                                        value={job.role}
                                        onChange={(e) => {
                                            const newJobs = [...input.employmentHistory];
                                            newJobs[index] = { ...job, role: e.target.value };
                                            setInput({ ...input, employmentHistory: newJobs });
                                        }}
                                        placeholder="Enter role"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Company</Label>
                                    <Input
                                        value={job.company}
                                        onChange={(e) => {
                                            const newJobs = [...input.employmentHistory];
                                            newJobs[index] = { ...job, company: e.target.value };
                                            setInput({ ...input, employmentHistory: newJobs });
                                        }}
                                        placeholder="Enter company name"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Duration</Label>
                                    <Input
                                        value={job.duration}
                                        onChange={(e) => {
                                            const newJobs = [...input.employmentHistory];
                                            newJobs[index] = { ...job, duration: e.target.value };
                                            setInput({ ...input, employmentHistory: newJobs });
                                        }}
                                        placeholder="e.g., Jan 2023 - Present"
                                        className="border-gray-300 focus:border-blue-500 focus:ring-0"
                                        autoFocus={false}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-gray-700 font-medium">Description</Label>
                                    <textarea
                                        value={job.description}
                                        onChange={(e) => {
                                            const newJobs = [...input.employmentHistory];
                                            newJobs[index] = { ...job, description: e.target.value };
                                            setInput({ ...input, employmentHistory: newJobs });
                                        }}
                                        placeholder="Describe your responsibilities and achievements"
                                        rows={3}
                                        className="w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-0 text-sm px-3 py-2 resize-none"
                                        autoFocus={false}
                                    />
                                </div>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setInput({
                                    ...input,
                                    employmentHistory: [...input.employmentHistory, { role: "", company: "", duration: "", description: "" }]
                                });
                            }}
                            className="w-full"
                        >
                            Add Job
                        </Button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={(open) => {
            setOpen(open);
            if (!open) setEditingSection(null);
        }}>
            <style jsx global>{`
                .focus\\:ring-0:focus {
                    --tw-ring-offset-width: 0px;
                    --tw-ring-offset-color: transparent;
                    --tw-ring-color: transparent;
                    --tw-ring-offset-shadow: none;
                    --tw-ring-shadow: none;
                }
                input:focus, textarea:focus, select:focus {
                    outline: none;
                    box-shadow: 0 0 0 1px #3b82f6;
                    border-color: #3b82f6;
                }
                input:-internal-autofill-selected {
                    background-color: white !important;
                }
            `}</style>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
            >
                <DialogContent className={`max-w-4xl w-full p-0 rounded-xl overflow-hidden ${cardShadow} bg-white`}>
                    {/* Header with clean, professional design - reduced padding */}
                    <div className="border-b border-gray-200 px-6 py-3">
                        <DialogTitle className="text-lg font-medium text-gray-800 mb-0">
                            {editingSection ? `Update ${editingSection.charAt(0).toUpperCase() + editingSection.slice(1)}` : 'Update Profile'}
                        </DialogTitle>
                        <p className="text-gray-500 mt-0.5 text-xs">
                            {editingSection ? `Edit your ${editingSection} information` : 'Fill in the information below to complete your profile'}
                        </p>
                    </div>

                    {/* Form content - reduced top padding */}
                    <div className="px-6 pt-3 pb-16 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <form onSubmit={submitHandler}>
                            {renderSection()}
                        </form>
                    </div>

                    {/* Submit Button - Positioned absolutely at the bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white py-3 px-6 border-t flex justify-end">
                        <motion.button
                            type="button"
                            onClick={submitHandler}
                            className="bg-blue-600 text-white font-medium px-6 py-2 rounded-md transition-all duration-300 transform active:scale-95 hover:bg-blue-700 w-auto"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    <span>Updating...</span>
                                </div>
                            ) : (
                                "Update"
                            )}
                        </motion.button>
                    </div>
                </DialogContent>
            </motion.div>
        </Dialog>
    );
};

export default UpdateProfileDialog;
