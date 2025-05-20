import React from 'react';
import { Button } from "./ui/button";
import { Briefcase, DollarSign, MapPin, ArrowRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";

const SimilarJobs = ({ similarJobs, navigate }) => {
  if (!similarJobs?.length) {
    return null;
  }
  
  // Get company initials for avatar fallback
  const getCompanyInitials = (name) => {
    if (!name) return "CO";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Similar Jobs</h2>
      <div className="space-y-6">
        {similarJobs.map((job) => (
          <motion.div
            key={job._id}
            className="p-6 border rounded-xl shadow-sm bg-white hover:bg-blue-50/30 transition-all duration-200 hover:border-blue-200 cursor-pointer"
            onClick={() => navigate(`/description/${job._id}`)}
            whileHover={{ y: -4 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Company Logo & Name */}
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16 rounded-xl border-2 border-gray-100 p-0.5 bg-blue-50">
                <AvatarImage 
                  src={job?.company?.logo || '/placeholder-company.png'} 
                  alt={job?.company?.name || "Company"} 
                  onError={(e) => {
                    e.target.src = 'https://ui-avatars.com/api/?name=' + 
                      encodeURIComponent(job?.company?.name || 'C') + 
                      '&background=E9F0FF&color=4285F4';
                  }}
                />
                <AvatarFallback className="bg-blue-50 text-blue-700 font-semibold">
                  {getCompanyInitials(job?.company?.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-gray-900 text-base">{job?.company?.name || 'Unknown Company'}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin size={14} className="text-blue-500" /> {job?.jobLocation || 'Not Specified'}
                </p>
              </div>
            </div>

            {/* Job Title & Position */}
            <h4 className="text-xl font-semibold text-gray-900 mb-2">{job?.title}</h4>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm border border-blue-100 mb-4">
              {job?.position}
            </Badge>

            {/* Job Details */}
            <div className="flex justify-between items-center text-gray-700 text-sm mt-4">
              <div className="flex items-center gap-1.5">
                <Briefcase size={16} className="text-green-500" />
                <span className="text-gray-600">{job?.jobType}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign size={16} className="text-purple-500" />
                <span className="text-gray-600">{job?.salary ? `${job?.salary} LPA` : 'Not Disclosed'}</span>
              </div>
            </div>

            {/* View Details Button */}
            <Button
              className="w-full mt-5 bg-blue-600 text-white hover:bg-blue-700 transition-all rounded-lg flex items-center justify-center gap-1 py-2.5 text-base"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/description/${job._id}`);
              }}
            >
              View Details
              <ArrowRight size={16} />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SimilarJobs; 