import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./shared/Navbar";
import Job from "./Job";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, ArrowLeft, Clock, Badge, Tag, ChevronRight, Info, Bookmark, MapPin, Star, BookmarkCheck } from "lucide-react";
import { Button } from "./ui/button";

const RecommendedJobs = () => {
  const navigate = useNavigate();
  const { allJobs } = useSelector((store) => store.job);
  const { user } = useSelector((store) => store.auth);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchCriteria, setMatchCriteria] = useState({});
  const [bookmarkedJobs, setBookmarkedJobs] = useState({});

  useEffect(() => {
    const userProfile = user?.profile || {};
    const preferredLocation = userProfile.preferredLocation || "";
    const jobType = userProfile.jobType || "";
    const preferredRole = userProfile.preferredRole || "";
    const skills = userProfile.skills || [];

    // Load saved bookmarks from localStorage
    const savedBookmarks = localStorage.getItem('bookmarkedJobs');
    if (savedBookmarks) {
      setBookmarkedJobs(JSON.parse(savedBookmarks));
    }

    setMatchCriteria({
      preferredLocation,
      jobType,
      preferredRole,
      skills
    });

    if (allJobs.length > 0) {
      const jobsWithScores = allJobs.map(job => {
        let score = 0;
        let matchedCriteria = [];
        
        if (preferredLocation && 
            (job.jobLocation?.toLowerCase().includes(preferredLocation.toLowerCase()) || 
             job.company?.location?.toLowerCase().includes(preferredLocation.toLowerCase()))) {
          score += 2;
          matchedCriteria.push("location");
        }
        
        if (jobType && job.jobType === jobType) {
          score += 2;
          matchedCriteria.push("jobType");
        }
        
        if (preferredRole && 
            (job.title?.toLowerCase().includes(preferredRole.toLowerCase()) || 
             job.position?.toLowerCase().includes(preferredRole.toLowerCase()))) {
          score += 2;
          matchedCriteria.push("role");
        }
        
        if (skills.length > 0) {
          const jobRequirements = job.requirements || [];
          const jobDescription = job.description || "";
          
          skills.forEach(skill => {
            const skillLower = skill.toLowerCase();
            
            if (jobRequirements.some(req => req.toLowerCase().includes(skillLower))) {
              score += 1;
              if (!matchedCriteria.includes("skills")) {
                matchedCriteria.push("skills");
              }
            } 
            else if (jobDescription.toLowerCase().includes(skillLower)) {
              score += 0.5;
              if (!matchedCriteria.includes("skills")) {
                matchedCriteria.push("skills");
              }
            }
          });
        }
        
        return {
          ...job,
          score,
          matchedCriteria
        };
      });
      
      const recommended = jobsWithScores
        .filter(job => job.matchedCriteria.length >= 2)
        .sort((a, b) => b.score - a.score);
      
      setRecommendedJobs(recommended);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [allJobs, user]);

  // Get badge color based on match percentage
  const getMatchColor = (score) => {
    const matchPercentage = Math.round(score * 10);
    if (matchPercentage >= 80) return "from-green-500 to-green-600";
    if (matchPercentage >= 60) return "from-blue-500 to-blue-600";
    if (matchPercentage >= 40) return "from-indigo-500 to-indigo-600";
    return "from-violet-500 to-violet-600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-5 py-4 sm:py-5">
        {/* Compact Header with Back Button */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm hover:shadow transition-shadow"
            >
              <ArrowLeft className="h-4 w-4 text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Recommended Jobs</h1>
              <p className="text-sm text-gray-500">
                Personalized matches based on your profile
              </p>
            </div>
          </div>
          
          {recommendedJobs.length > 0 && !loading && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
              {recommendedJobs.length} match{recommendedJobs.length !== 1 ? 'es' : ''}
            </div>
          )}
        </div>

        {/* Matching Criteria Row */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Info className="h-4 w-4 text-blue-500" />
              <span>Matching based on:</span>
            </div>
            
            <div className="flex flex-wrap gap-2 ml-auto">
              <Link to="/profile" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                Update profile <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm shadow-sm">
              <MapPin className="h-3 w-3 text-blue-500" />
              <span className="font-medium">{matchCriteria.preferredLocation || "Any location"}</span>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm shadow-sm">
              <Briefcase className="h-3 w-3 text-green-500" />
              <span className="font-medium">{matchCriteria.jobType || "Any type"}</span>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm shadow-sm">
              <Badge className="h-3 w-3 text-indigo-500" />
              <span className="font-medium">{matchCriteria.preferredRole || "Any role"}</span>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm shadow-sm">
              <Tag className="h-3 w-3 text-amber-500" />
              <span className="font-medium">
                {matchCriteria.skills?.length > 0 
                  ? `${matchCriteria.skills.length} skill${matchCriteria.skills.length > 1 ? 's' : ''}` 
                  : "Any skills"}
              </span>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center">
              <Star className="h-4 w-4 mr-1.5 text-amber-500" />
              {loading ? "Finding matches..." : "Recommended Jobs"}
            </h2>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-7"
              onClick={() => navigate("/browse")}
            >
              View All Jobs
            </Button>
          </div>
        
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-blue-500"></div>
              <p className="mt-4 text-sm text-gray-500">Finding your perfect matches...</p>
            </div>
          ) : recommendedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {recommendedJobs.map((job) => (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="h-full relative group"
                  >
                    {/* Match Badge Overlay */}
                    <div className="absolute top-3 left-3 z-10">
                      <div className={`inline-flex items-center bg-gradient-to-r ${getMatchColor(job.score)} px-2 py-0.5 rounded-full text-white text-xs font-medium shadow-sm`}>
                        <Star className="h-3 w-3 mr-1" fill="white" />
                        {Math.round(job.score * 10)}% Match
                      </div>
                    </div>
                    
                    <Job 
                      job={job} 
                      className={bookmarkedJobs[job._id] ? "border-blue-200" : ""}
                      onClick={() => navigate(`/description/${job?._id}`)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200 my-4">
              <div className="mx-auto w-12 h-12 mb-3 flex items-center justify-center rounded-full bg-gray-100">
                <Briefcase className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">No matches found</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
                We couldn't find jobs matching your current preferences.
              </p>
              <div className="flex justify-center gap-2">
                <Button 
                  onClick={() => navigate("/profile")}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Update Profile
                </Button>
                <Button 
                  onClick={() => navigate("/browse")}
                  variant="outline"
                  size="sm"
                  className="border-gray-300"
                >
                  Browse All
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendedJobs;