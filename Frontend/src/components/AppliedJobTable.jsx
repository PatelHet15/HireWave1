import React, { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { useSelector, useDispatch } from "react-redux";
import { 
  AlertCircle, Building2, Calendar, ChevronRight, Briefcase, Tag, MapPin, 
  Filter, Search, Clock, ClipboardCheck, XCircle, CheckCircle,
  DollarSign, ChevronsRight, Info, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { format, parseISO } from 'date-fns';
import useGetAppliedJobs from "../hooks/UseGetAppliedJobs";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { APPLICATION_API_END_POINT } from "../utils/constant";

const AppliedJobTable = () => {
  const { allAppliedJobs } = useSelector((state) => state.job);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const refreshJobs = useGetAppliedJobs();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch jobs when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await refreshJobs();
      } catch (error) {
        console.error("Error loading initial jobs data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Count applications by status
  const applicationStats = React.useMemo(() => {
    const stats = {
      total: allAppliedJobs?.length || 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      in_progress: 0
    };
    
    allAppliedJobs?.forEach(app => {
      const status = app?.status?.toLowerCase();
      if (stats.hasOwnProperty(status)) {
        stats[status]++;
      }
    });
    
    return stats;
  }, [allAppliedJobs]);



  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortOrder("newest");
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusTooltip = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "Your application is being reviewed by the employer";
      case "accepted":
        return "Congratulations! Your application has been accepted";
      case "rejected":
        return "Your application was not selected for this position";
      case "in_progress":
        return "You're in the interview process for this position";
      default:
        return "Application status unknown";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "in_progress":
        return <ClipboardCheck className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const handleJobClick = (jobId, status) => {
    if (jobId) {
      if (status.toLowerCase() === 'accepted' || status.toLowerCase() === 'in_progress') {
        navigate(`/candidate/job/${jobId}/progress`);
      } else {
        navigate(`/description/${jobId}`);
      }
    }
  };

  // Filter and sort jobs
  const filteredJobs = (allAppliedJobs || [])
    .filter(job => {
      // Filter by search term
      const searchMatch = 
        !searchTerm || 
        (job?.job?.title && job.job.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job?.job?.company?.name && job.job.company.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by status
      const statusMatch = statusFilter === "all" || (job?.status && job.status.toLowerCase() === statusFilter);
      
      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      // Sort by date
      if (sortOrder === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      } else {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
    });

  // Skeleton loader for loading state
  const SkeletonLoader = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <div className="flex flex-wrap gap-3 mt-3">
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-6 w-32 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (!allAppliedJobs || allAppliedJobs?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-gray-50 rounded-full p-4 mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
        <p className="text-gray-500 text-center max-w-sm mb-6">
          You haven't applied to any jobs yet. Start exploring opportunities and submit your first application!
        </p>
        <Button 
          onClick={() => navigate('/jobs')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Briefcase className="w-4 h-4 mr-2" />
          Browse Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-gray-500 text-sm mb-1">Total</p>
          <p className="text-2xl font-semibold">{applicationStats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-amber-100 p-4 text-center">
          <p className="text-amber-600 text-sm mb-1">Pending</p>
          <p className="text-2xl font-semibold text-amber-700">{applicationStats.pending}</p>
        </div>
        <div className="bg-white rounded-lg border border-blue-100 p-4 text-center">
          <p className="text-blue-600 text-sm mb-1">In Progress</p>
          <p className="text-2xl font-semibold text-blue-700">{applicationStats.in_progress}</p>
        </div>
        <div className="bg-white rounded-lg border border-emerald-100 p-4 text-center">
          <p className="text-emerald-600 text-sm mb-1">Accepted</p>
          <p className="text-2xl font-semibold text-emerald-700">{applicationStats.accepted}</p>
        </div>
        <div className="bg-white rounded-lg border border-rose-100 p-4 text-center">
          <p className="text-rose-600 text-sm mb-1">Rejected</p>
          <p className="text-2xl font-semibold text-rose-700">{applicationStats.rejected}</p>
        </div>
      </div>

      {/* Search and filter controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by job title or company..."
              className="pl-10 w-full border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(searchTerm || statusFilter !== "all" || sortOrder !== "newest") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-gray-500"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Filter badges */}
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-sm text-gray-500 flex items-center">
            <Filter className="w-3 h-3 mr-1" /> Filter by:
          </span>
          <Badge 
            className={`px-3 py-1 cursor-pointer ${statusFilter === 'all' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </Badge>
          <Badge 
            className={`px-3 py-1 cursor-pointer ${statusFilter === 'pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Badge>
          <Badge 
            className={`px-3 py-1 cursor-pointer ${statusFilter === 'in_progress' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            onClick={() => setStatusFilter('in_progress')}
          >
            In Progress
          </Badge>
          <Badge 
            className={`px-3 py-1 cursor-pointer ${statusFilter === 'accepted' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            onClick={() => setStatusFilter('accepted')}
          >
            Accepted
          </Badge>
          <Badge 
            className={`px-3 py-1 cursor-pointer ${statusFilter === 'rejected' ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            onClick={() => setStatusFilter('rejected')}
          >
            Rejected
          </Badge>

          <div className="ml-auto">
            <select
              className="px-3 py-1 rounded-md border border-gray-200 text-sm text-gray-700 bg-white"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>
      
      {filteredJobs.length === 0 ? (
        <div className="bg-white p-6 rounded-lg text-center border border-gray-200">
          <Filter className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-gray-700 font-medium">No matching applications</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Try adjusting your filters</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <AnimatePresence>
            {filteredJobs.map((appliedJob) => {
              const jobTitle = appliedJob?.job?.title || "N/A";
              const companyName = appliedJob?.job?.company?.name || "N/A";
              const companyInitials = companyName.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
              const status = appliedJob?.status || "Unknown";
              const jobType = appliedJob?.job?.jobType || "N/A";
              const jobLocation = appliedJob?.job?.jobLocation || "Remote";
              const salary = appliedJob?.job?.salary;
              
              const createdAt = appliedJob?.createdAt 
                ? format(parseISO(appliedJob.createdAt), 'MMM d, yyyy')
                : "N/A";
              
              const jobId = appliedJob?.job?._id;

              // Skip applications with missing job data
              if (!jobId) return null;

              return (
                <motion.div
                  key={appliedJob?._id}
                  variants={item}
                  layout
                  className="group bg-white rounded-xl p-5 hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-blue-100 cursor-pointer"
                  onClick={() => handleJobClick(jobId, status)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-14 w-14 rounded-lg overflow-hidden border-2 border-gray-100">
                        {appliedJob?.job?.company?.logo ? (
                          <>
                            <img 
                              src={appliedJob?.job?.company?.logo} 
                              alt={companyName} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                            <div className="hidden w-full h-full items-center justify-center bg-blue-100 text-blue-600 font-semibold text-lg">
                              {companyInitials}
                            </div>
                          </>
                        ) : (
                          <div className="flex w-full h-full items-center justify-center bg-blue-100 text-blue-600 font-semibold text-lg">
                            {companyInitials}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {jobTitle}
                          </h3>
                          <div className="flex items-center gap-3 text-gray-500 text-sm mt-1">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4" />
                              <span>{companyName}</span>
                            </div>
                            {salary && (
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4" />
                                <span>{typeof salary === 'number' ? `$${salary.toLocaleString()}` : salary}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge className={`px-3 py-1.5 border flex items-center gap-1.5 ${getStatusColor(status)}`}>
                                  {getStatusIcon(status)}
                                  {status}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{getStatusTooltip(status)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                          <Briefcase className="w-3 h-3" />
                          {jobType}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                          <MapPin className="w-3 h-3" />
                          {jobLocation}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                          <Calendar className="w-3 h-3" />
                          Applied on {createdAt}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center mt-2 sm:mt-0">
                      <ChevronsRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default AppliedJobTable;
