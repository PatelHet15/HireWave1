import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./shared/Navbar";
import Job from "./Job";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ArrowLeft, Building2, Map, Navigation, ChevronRight, Briefcase, Search, Star, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "./ui/button";

const JobsNearYou = () => {
  const navigate = useNavigate();
  const { allJobs } = useSelector((store) => store.job);
  const { user } = useSelector((store) => store.auth);
  const [nearbyJobs, setNearbyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState("");
  const [locationRadius, setLocationRadius] = useState("Exact match");

  useEffect(() => {
    const userProfile = user?.profile || {};
    const profileLocation = userProfile.location || "";
    const preferredLocation = userProfile.preferredLocation || "";
    const location = preferredLocation || profileLocation;
    setUserLocation(location);

    if (allJobs.length > 0 && location) {
      const nearby = allJobs.filter(job => {
        const jobLocation = job.jobLocation || job.company?.location || "";
        return jobLocation.toLowerCase().includes(location.toLowerCase()) || 
               location.toLowerCase().includes(jobLocation.toLowerCase());
      });
      setNearbyJobs(nearby);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [allJobs, user]);

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
              <h1 className="text-xl font-bold text-gray-900">Jobs Near You</h1>
              <p className="text-sm text-gray-500">
                Opportunities in {userLocation || "your area"}
              </p>
            </div>
          </div>
          
          {nearbyJobs.length > 0 && !loading && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
              {nearbyJobs.length} job{nearbyJobs.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>

        {/* Location Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span>Location settings</span>
            </div>
            
            <div className="flex flex-wrap gap-2 ml-auto">
              <Link to="/profile" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                Update location <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm shadow-sm">
              <Navigation className="h-3 w-3 text-blue-500" />
              <span className="font-medium">{userLocation || "No location set"}</span>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm shadow-sm">
              <Map className="h-3 w-3 text-blue-500" />
              <span className="font-medium">{locationRadius}</span>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm shadow-sm">
              <Building2 className="h-3 w-3 text-blue-500" />
              <span className="font-medium">{loading ? "Calculating..." : `${nearbyJobs.length} matches`}</span>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center">
              {loading ? "Finding jobs in your area..." : `Jobs in ${userLocation || "Your Area"}`}
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
              <p className="mt-4 text-sm text-gray-500">Finding jobs in your area...</p>
            </div>
          ) : !userLocation ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200 my-4">
              <div className="mx-auto w-12 h-12 mb-3 flex items-center justify-center rounded-full bg-gray-100">
                <MapPin className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">No location specified</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
                To find jobs near you, please update your profile with your current location or preferred work location.
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
          ) : nearbyJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {nearbyJobs.map((job) => (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="h-full relative group"
                  >
                    <Job 
                      job={job} 
                      className=""
                      onClick={() => navigate(`/description/${job?._id}`)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200 my-4">
              <div className="mx-auto w-12 h-12 mb-3 flex items-center justify-center rounded-full bg-gray-100">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">No jobs found in your area</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
                We couldn't find any jobs near {userLocation}. Try updating your location or browse all jobs.
              </p>
              <div className="flex justify-center gap-2">
                <Button 
                  onClick={() => navigate("/profile")}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Update Location
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

export default JobsNearYou;