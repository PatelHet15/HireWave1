import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '../shared/Navbar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { JOB_API_END_POINT } from '@/utils/constant';

const JobEdit = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { allAdminJobs } = useSelector(state => state.job);
    
    const [isLoading, setIsLoading] = useState(false);
    const [job, setJob] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        salary: '',
        experienceLevel: '',
        jobLocation: '',
        jobType: 'Full-Time',
        requiredSkills: '',
        applicationDeadline: ''
    });

    // Find the job from the Redux store
    useEffect(() => {
        const selectedJob = allAdminJobs.find(job => job._id === jobId);
        if (selectedJob) {
            setJob(selectedJob);
            
            // Initialize form data with job details
            setFormData({
                title: selectedJob.title || '',
                description: selectedJob.description || '',
                salary: selectedJob.salary || '',
                experienceLevel: selectedJob.experienceLevel || '',
                jobLocation: selectedJob.jobLocation || '',
                jobType: selectedJob.jobType || 'Full-Time',
                requiredSkills: selectedJob.requiredSkills?.join(', ') || '',
                applicationDeadline: selectedJob.applicationDeadline 
                    ? new Date(selectedJob.applicationDeadline).toISOString().split('T')[0]
                    : ''
            });
        } else {
            // If job not in Redux store, fetch it from the API
            fetchJobDetails();
        }
    }, [jobId, allAdminJobs]);

    // Fetch job details if not in Redux store
    const fetchJobDetails = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('token') && {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    })
                }
            });
            
            if (res.data.success) {
                const jobData = res.data.job;
                setJob(jobData);
                
                // Initialize form data with job details
                setFormData({
                    title: jobData.title || '',
                    description: jobData.description || '',
                    salary: jobData.salary || '',
                    experienceLevel: jobData.experienceLevel || '',
                    jobLocation: jobData.jobLocation || '',
                    jobType: jobData.jobType || 'Full-Time',
                    requiredSkills: jobData.requiredSkills?.join(', ') || '',
                    applicationDeadline: jobData.applicationDeadline 
                        ? new Date(jobData.applicationDeadline).toISOString().split('T')[0]
                        : ''
                });
            }
        } catch (error) {
            console.error('Error fetching job details:', error);
            toast.error('Failed to load job details. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleSelectChange = (value, name) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form data
        if (!formData.title.trim()) {
            toast.error('Job title is required');
            return;
        }
        
        try {
            setIsLoading(true);
            
            // Convert required skills from string to array
            const processedData = {
                ...formData,
                requiredSkills: formData.requiredSkills.split(',')
                    .map(skill => skill.trim())
                    .filter(skill => skill !== '')
            };
            
            const res = await axios.put(`${JOB_API_END_POINT}/update/${jobId}`, processedData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('token') && {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    })
                }
            });
            
            if (res.data.success) {
                toast.success('Job updated successfully');
                navigate('/admin/jobs');
            }
        } catch (error) {
            console.error('Error updating job:', error);
            toast.error(error.response?.data?.message || 'Failed to update job');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !job) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <Navbar />
                <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="ml-2 text-gray-600">Loading job details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar />
            <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
                <div className="mb-6 flex items-center">
                    <button 
                        onClick={() => navigate('/admin/jobs')}
                        className="text-gray-600 hover:text-gray-900 flex items-center mr-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
                </div>
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white shadow-sm rounded-xl p-6"
                >
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="title" className="text-gray-700">Job Title <span className="text-red-500">*</span></Label>
                                <Input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="mt-1 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                                    placeholder="e.g. senior Software Developer"
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="description" className="text-gray-700">Job Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="mt-1 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-200 min-h-32"
                                    placeholder="Describe the job responsibilities and requirements..."
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="salary" className="text-gray-700">Salary (LPA)</Label>
                                    <Input
                                        id="salary"
                                        name="salary"
                                        type="text"
                                        value={formData.salary}
                                        onChange={handleInputChange}
                                        className="mt-1 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                                        placeholder="e.g. 15-20"
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="experienceLevel" className="text-gray-700">Experience Level</Label>
                                    <Input
                                        id="experienceLevel"
                                        name="experienceLevel"
                                        type="text"
                                        value={formData.experienceLevel}
                                        onChange={handleInputChange}
                                        className="mt-1 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                                        placeholder="e.g. 3-5 years"
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="jobLocation" className="text-gray-700">Job Location</Label>
                                    <Input
                                        id="jobLocation"
                                        name="jobLocation"
                                        type="text"
                                        value={formData.jobLocation}
                                        onChange={handleInputChange}
                                        className="mt-1 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                                        placeholder="e.g. Bengaluru, India"
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="jobType" className="text-gray-700">Job Type</Label>
                                    <Select 
                                        name="jobType" 
                                        value={formData.jobType} 
                                        onValueChange={(value) => handleSelectChange(value, 'jobType')}
                                    >
                                        <SelectTrigger className="mt-1 bg-gray-50 border-gray-200">
                                            <SelectValue placeholder="Select job type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Full-Time">Full-Time</SelectItem>
                                            <SelectItem value="Part-Time">Part-Time</SelectItem>
                                            <SelectItem value="Contract">Contract</SelectItem>
                                            <SelectItem value="Remote">Remote</SelectItem>
                                            <SelectItem value="Internship">Internship</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div>
                                <Label htmlFor="requiredSkills" className="text-gray-700">Required Skills (comma-separated)</Label>
                                <Input
                                    id="requiredSkills"
                                    name="requiredSkills"
                                    type="text"
                                    value={formData.requiredSkills}
                                    onChange={handleInputChange}
                                    className="mt-1 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                                    placeholder="e.g. JavaScript, React, Node.js"
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="applicationDeadline" className="text-gray-700">Application Deadline</Label>
                                <Input
                                    id="applicationDeadline"
                                    name="applicationDeadline"
                                    type="date"
                                    value={formData.applicationDeadline}
                                    onChange={handleInputChange}
                                    className="mt-1 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                                />
                            </div>
                        </div>
                        
                        <div className="mt-8 flex justify-between">
                            <Button 
                                type="button"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center"
                                onClick={() => {
                                    // This would need confirmation dialog in a real app
                                    toast.error('Delete functionality not implemented');
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Job
                            </Button>
                            
                            <div className="space-x-4">
                                <Button 
                                    type="button"
                                    variant="outline"
                                    className="border-gray-200 text-gray-700"
                                    onClick={() => navigate('/admin/jobs')}
                                >
                                    Cancel
                                </Button>
                                
                                <Button 
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default JobEdit; 