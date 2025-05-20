import React, { useEffect, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Bookmark, MoreHorizontal, MapPin, Briefcase, DollarSign, Calendar, Edit2, Eye, Clock, List } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';

const AdminJobsTable = ({ filterType = 'all' }) => {
    const { allAdminJobs, searchJobByText } = useSelector(store => store.job);
    const [filterJobs, setFilterJobs] = useState(allAdminJobs);
    const [showDropdown, setShowDropdown] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Filter jobs based on search text and filter type
        let filteredJobs = allAdminJobs;
        
        // Apply search filter
        if (searchJobByText) {
            filteredJobs = filteredJobs.filter((job) =>
                job?.title.toLowerCase().includes(searchJobByText.toLowerCase()) ||
                job?.company?.name?.toLowerCase().includes(searchJobByText.toLowerCase())
            );
        }
        
        // Apply category filter
        if (filterType !== 'all') {
            // This is just a placeholder - you would need to add status to your job model
            filteredJobs = filteredJobs.filter((job) => {
                const jobDate = new Date(job.createdAt);
                const now = new Date();
                const daysDifference = Math.floor((now - jobDate) / (1000 * 60 * 60 * 24));
                
                if (filterType === 'active') return daysDifference < 30;
                if (filterType === 'expired') return daysDifference >= 30;
                if (filterType === 'draft') return job.isDraft; // You'd need this field in your model
                return true;
            });
        }
        
        setFilterJobs(filteredJobs);
    }, [allAdminJobs, searchJobByText, filterType]);

    const toggleDropdown = (jobId) => {
        setShowDropdown(prev => (prev === jobId ? null : jobId));
    };

    const getJobStatus = (job) => {
        const jobDate = new Date(job.createdAt);
        const now = new Date();
        const daysDifference = Math.floor((now - jobDate) / (1000 * 60 * 60 * 24));
        
        if (daysDifference < 30) {
            return { status: 'Active', color: 'bg-green-100 text-green-800' };
        } else {
            return { status: 'Expired', color: 'bg-red-100 text-red-800' };
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {filterJobs.length > 0 ? (
                filterJobs.map((job) => {
                    const status = getJobStatus(job);
                    
                    return (
                        <motion.div
                            key={job._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                            className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md hover:bg-blue-50 hover:border-blue-700 transition-all duration-300 cursor-pointer"
                            onClick={(e) => {
                                // Prevent navigation if clicking on buttons or dropdown
                                if (e.target.closest('button') || e.target.closest('.dropdown-content')) {
                                    return;
                                }
                                navigate(`/admin/jobs/pipeline/${job._id}/candidates`);
                            }}
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="w-12 h-12 border border-gray-100 rounded-lg">
                                            <AvatarImage 
                                                src={job?.company?.logo} 
                                                alt={job?.company?.name} 
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                                {job?.company?.name?.charAt(0) || "C"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-lg font-semibold text-gray-900 mr-2">{job.title}</h2>
                                                <Badge className={status.color}>{status.status}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{job?.company?.name}</p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                                                <span className="text-xs text-gray-600 flex items-center">
                                                    <MapPin className="w-3.5 h-3.5 mr-1" /> {job.jobLocation || "Remote"}
                                                </span>
                                                <span className="text-xs text-gray-600 flex items-center">
                                                    <Briefcase className="w-3.5 h-3.5 mr-1" /> {job.experienceLevel || "Not specified"}
                                                </span>
                                                <span className="text-xs text-gray-600 flex items-center">
                                                    <DollarSign className="w-3.5 h-3.5 mr-1" /> {job.salary ? `${job.salary} LPA` : "Not specified"}
                                                </span>
                                                <span className="text-xs text-gray-600 flex items-center">
                                                    <Clock className="w-3.5 h-3.5 mr-1" /> {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                   
                                </div>

                                <div className="border-t border-gray-100 pt-3 mt-1">
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {job.description?.slice(0, 150) || "No description available."}
                                        {job.description?.length > 150 && "..."}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    {/* <button 
                                        onClick={() => navigate(`/admin/jobs/edit/${job._id}`)}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit Details
                                    </button> */}
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => navigate(`/admin/jobs/pipeline/${job._id}`)}
                                            className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                                        >
                                            <List className="w-4 h-4" /> Pipeline
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })
            ) : (
                <div className="col-span-2 py-16 flex flex-col items-center justify-center bg-white rounded-lg border border-gray-200">
                    <Briefcase className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs found</h3>
                    <p className="text-gray-500 max-w-md text-center">
                        {searchJobByText 
                            ? `No jobs match your search "${searchJobByText}"`
                            : "You haven't created any jobs yet or none match the current filter."}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminJobsTable;


{/* <div className="relative">
<button
    onClick={() => toggleDropdown(job._id)}
    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
>
    <MoreHorizontal className="w-5 h-5" />
</button>

{showDropdown === job._id && (
    <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden z-10 dropdown-content">
        <button
            onClick={() => navigate(`/admin/jobs/edit/${job._id}`)}
            className="flex items-center gap-2 w-full text-sm px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
        >
            <Edit2 className="w-4 h-4" /> Edit Job Details
        </button>
        <button
            onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}
            className="flex items-center gap-2 w-full text-sm px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
        >
            <Users className="w-4 h-4" /> View Applicants
        </button>
        <button
            onClick={() => navigate(`/admin/jobs/pipeline/${job._id}`)}
            className="flex items-center gap-2 w-full text-sm px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
        >
            <List className="w-4 h-4" /> Manage Pipeline
        </button>
    </div>
)}
</div> */}
